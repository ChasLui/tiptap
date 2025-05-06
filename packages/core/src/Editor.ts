/* eslint-disable @typescript-eslint/no-empty-object-type */
import {
  MarkType,
  Node as ProseMirrorNode,
  NodeType,
  Schema,
} from '@tiptap/pm/model'
import {
  EditorState, Plugin, PluginKey, Transaction,
} from '@tiptap/pm/state'
import { EditorView } from '@tiptap/pm/view'

import { CommandManager } from './CommandManager.js'
import { EventEmitter } from './EventEmitter.js'
import { ExtensionManager } from './ExtensionManager.js'
import {
  ClipboardTextSerializer, Commands, Drop, Editable, FocusEvents, Keymap, Paste,
  Tabindex,
} from './extensions/index.js'
import { createDocument } from './helpers/createDocument.js'
import { getAttributes } from './helpers/getAttributes.js'
import { getHTMLFromFragment } from './helpers/getHTMLFromFragment.js'
import { getText } from './helpers/getText.js'
import { getTextSerializersFromSchema } from './helpers/getTextSerializersFromSchema.js'
import { isActive } from './helpers/isActive.js'
import { isNodeEmpty } from './helpers/isNodeEmpty.js'
import { resolveFocusPosition } from './helpers/resolveFocusPosition.js'
import { NodePos } from './NodePos.js'
import { style } from './style.js'
import {
  CanCommands,
  ChainedCommands,
  EditorEvents,
  EditorOptions,
  JSONContent,
  SingleCommands,
  TextSerializer,
} from './types.js'
import { createStyleTag } from './utilities/createStyleTag.js'
import { isFunction } from './utilities/isFunction.js'

export * as extensions from './extensions/index.js'

// @ts-ignore
export interface TiptapEditorHTMLElement extends HTMLElement {
  editor?: Editor
}

export class Editor extends EventEmitter<EditorEvents> {
  private commandManager!: CommandManager

  public extensionManager!: ExtensionManager

  private css!: HTMLStyleElement

  public schema!: Schema

  public view!: EditorView

  public isFocused = false

  /**
   * 在 `create` 事件被触发后，编辑器被认为是初始化的。
   */
  public isInitialized = false

  public extensionStorage: Record<string, any> = {}

  public options: EditorOptions = {
    element: document.createElement('div'),
    content: '',
    injectCSS: true,
    injectNonce: undefined,
    extensions: [],
    autofocus: false,
    editable: true,
    editorProps: {},
    parseOptions: {},
    coreExtensionOptions: {},
    enableInputRules: true,
    enablePasteRules: true,
    enableCoreExtensions: true,
    enableContentCheck: false,
    onBeforeCreate: () => null,
    onCreate: () => null,
    onUpdate: () => null,
    onSelectionUpdate: () => null,
    onTransaction: () => null,
    onFocus: () => null,
    onBlur: () => null,
    onDestroy: () => null,
    onContentError: ({ error }) => { throw error },
    onPaste: () => null,
    onDrop: () => null,
  }

  constructor(options: Partial<EditorOptions> = {}) {
    super()
    this.setOptions(options)
    this.createExtensionManager()
    this.createCommandManager()
    this.createSchema()
    this.on('beforeCreate', this.options.onBeforeCreate)
    this.emit('beforeCreate', { editor: this })
    this.on('contentError', this.options.onContentError)
    this.createView()
    this.injectCSS()
    this.on('create', this.options.onCreate)
    this.on('update', this.options.onUpdate)
    this.on('selectionUpdate', this.options.onSelectionUpdate)
    this.on('transaction', this.options.onTransaction)
    this.on('focus', this.options.onFocus)
    this.on('blur', this.options.onBlur)
    this.on('destroy', this.options.onDestroy)
    this.on('drop', ({ event, slice, moved }) => this.options.onDrop(event, slice, moved))
    this.on('paste', ({ event, slice }) => this.options.onPaste(event, slice))

    window.setTimeout(() => {
      if (this.isDestroyed) {
        return
      }

      this.commands.focus(this.options.autofocus)
      this.emit('create', { editor: this })
      this.isInitialized = true
    }, 0)
  }

  /**
   * 返回编辑器存储。
   */
  public get storage(): Record<string, any> {
    return this.extensionStorage
  }

  /**
   * 一个包含所有注册命令的对象。
   */
  public get commands(): SingleCommands {
    return this.commandManager.commands
  }

  /**
   * 创建一个命令链，用于一次调用多个命令。
   */
  public chain(): ChainedCommands {
    return this.commandManager.chain()
  }

  /**
   * 检查一个命令或命令链是否可以执行。不执行它。
   */
  public can(): CanCommands {
    return this.commandManager.can()
  }

  /**
   * 注入 CSS 样式。
   */
  private injectCSS(): void {
    if (this.options.injectCSS && document) {
      this.css = createStyleTag(style, this.options.injectNonce)
    }
  }

  /**
   * 更新编辑器选项。
   *
   * @param options 一个选项列表
   */
  public setOptions(options: Partial<EditorOptions> = {}): void {
    this.options = {
      ...this.options,
      ...options,
    }

    if (!this.view || !this.state || this.isDestroyed) {
      return
    }

    if (this.options.editorProps) {
      this.view.setProps(this.options.editorProps)
    }

    this.view.updateState(this.state)
  }

  /**
   * 更新编辑器的可编辑状态。
   */
  public setEditable(editable: boolean, emitUpdate = true): void {
    this.setOptions({ editable })

    if (emitUpdate) {
      this.emit('update', { editor: this, transaction: this.state.tr })
    }
  }

  /**
   * 返回编辑器是否可编辑。
   */
  public get isEditable(): boolean {
    // 由于插件在创建视图后应用，
    // `editable` 在创建视图后始终为 `true` 一瞬间。
    // 这就是为什么我们也必须检查 `options.editable`
    return this.options.editable && this.view && this.view.editable
  }

  /**
   * 返回编辑器状态。
   */
  public get state(): EditorState {
    return this.view.state
  }

  /**
   * 注册一个 ProseMirror 插件。
   *
   * @param plugin 一个 ProseMirror 插件
   * @param handlePlugins 控制如何将插件合并到现有插件中。
   * @returns 新的编辑器状态
   */
  public registerPlugin(
    plugin: Plugin,
    handlePlugins?: (newPlugin: Plugin, plugins: Plugin[]) => Plugin[],
  ): EditorState {
    const plugins = isFunction(handlePlugins)
      ? handlePlugins(plugin, [...this.state.plugins])
      : [...this.state.plugins, plugin]

    const state = this.state.reconfigure({ plugins })

    this.view.updateState(state)

    return state
  }

  /**
   * 注销一个 ProseMirror 插件。
   *
   * @param nameOrPluginKeyToRemove 插件的名称
   * @returns 新的编辑器状态或 undefined 如果编辑器被销毁
   */
  public unregisterPlugin(nameOrPluginKeyToRemove: string | PluginKey | (string | PluginKey)[]): EditorState | undefined {
    if (this.isDestroyed) {
      return undefined
    }

    const prevPlugins = this.state.plugins
    let plugins = prevPlugins;

    ([] as (string | PluginKey)[]).concat(nameOrPluginKeyToRemove).forEach(nameOrPluginKey => {
      // @ts-ignore
      const name = typeof nameOrPluginKey === 'string' ? `${nameOrPluginKey}$` : nameOrPluginKey.key

      // @ts-ignore
      plugins = plugins.filter(plugin => !plugin.key.startsWith(name))
    })

    if (prevPlugins.length === plugins.length) {
      // No plugin was removed, so we don’t need to update the state
      return undefined
    }

    const state = this.state.reconfigure({
      plugins,
    })

    this.view.updateState(state)

    return state
  }

  /**
   * 创建一个扩展管理器。
   */
  private createExtensionManager(): void {

    const coreExtensions = this.options.enableCoreExtensions ? [
      Editable,
      ClipboardTextSerializer.configure({
        blockSeparator: this.options.coreExtensionOptions?.clipboardTextSerializer?.blockSeparator,
      }),
      Commands,
      FocusEvents,
      Keymap,
      Tabindex,
      Drop,
      Paste,
    ].filter(ext => {
      if (typeof this.options.enableCoreExtensions === 'object') {
        return this.options.enableCoreExtensions[ext.name as keyof typeof this.options.enableCoreExtensions] !== false
      }
      return true
    }) : []
    const allExtensions = [...coreExtensions, ...this.options.extensions].filter(extension => {
      return ['extension', 'node', 'mark'].includes(extension?.type)
    })

    this.extensionManager = new ExtensionManager(allExtensions, this)
  }

  /**
   * 创建一个命令管理器。
   */
  private createCommandManager(): void {
    this.commandManager = new CommandManager({
      editor: this,
    })
  }

  /**
   * 创建一个 ProseMirror 模式。
   */
  private createSchema(): void {
    this.schema = this.extensionManager.schema
  }

  /**
   * 创建一个 ProseMirror 视图。
   */
  private createView(): void {
    let doc: ProseMirrorNode

    try {
      doc = createDocument(
        this.options.content,
        this.schema,
        this.options.parseOptions,
        { errorOnInvalidContent: this.options.enableContentCheck },
      )
    } catch (e) {
      if (!(e instanceof Error) || !['[tiptap error]: Invalid JSON content', '[tiptap error]: Invalid HTML content'].includes(e.message)) {
        // 不是我们期望的内容错误
        throw e
      }
      this.emit('contentError', {
        editor: this,
        error: e as Error,
        disableCollaboration: () => {
          if (this.storage.collaboration) {
            this.storage.collaboration.isDisabled = true
          }
          // 为了避免同步回无效内容，重新初始化扩展，不包含协作扩展
          this.options.extensions = this.options.extensions.filter(extension => extension.name !== 'collaboration')

          // 通过重新创建扩展管理器来重新启动初始化过程，使用新的扩展集
          this.createExtensionManager()
        },
      })

      // 内容无效，但尝试创建它，剥离无效的部分
      doc = createDocument(
        this.options.content,
        this.schema,
        this.options.parseOptions,
        { errorOnInvalidContent: false },
      )
    }
    const selection = resolveFocusPosition(doc, this.options.autofocus)

    this.view = new EditorView(this.options.element, {
      ...this.options.editorProps,
      attributes: {
        // 添加 `role="textbox"` 到编辑器元素
        role: 'textbox',
        ...this.options.editorProps?.attributes,
      },
      dispatchTransaction: this.dispatchTransaction.bind(this),
      state: EditorState.create({
        doc,
        selection: selection || undefined,
      }),
    })

    // `editor.view` 在这个时间点还不可用。
    // 因此我们将在稍后直接添加所有插件和节点视图。
    const newState = this.state.reconfigure({
      plugins: this.extensionManager.plugins,
    })

    this.view.updateState(newState)

    this.createNodeViews()
    this.prependClass()

    // 让我们在 DOM 元素中存储编辑器实例。
    // 这样我们就可以在测试中访问它。
    // @ts-ignore
    const dom = this.view.dom as TiptapEditorHTMLElement

    dom.editor = this
  }

  /**
   * 创建所有节点视图。
   */
  public createNodeViews(): void {
    if (this.view.isDestroyed) {
      return
    }

    this.view.setProps({
      nodeViews: this.extensionManager.nodeViews,
    })
  }

  /**
   * 在元素上添加类名。
   */
  public prependClass(): void {
    this.view.dom.className = `tiptap ${this.view.dom.className}`
  }

  public isCapturingTransaction = false

  private capturedTransaction: Transaction | null = null

  public captureTransaction(fn: () => void) {
    this.isCapturingTransaction = true
    fn()
    this.isCapturingTransaction = false

    const tr = this.capturedTransaction

    this.capturedTransaction = null

    return tr
  }

  /**
   * 发送交易（状态更新）的回调。
   *
   * @param transaction 一个编辑器状态事务
   */
  private dispatchTransaction(transaction: Transaction): void {
    // 如果编辑器 / 编辑器的视图被销毁
    // 事务不应被分派，因为不再有视图。
    if (this.view.isDestroyed) {
      return
    }

    if (this.isCapturingTransaction) {
      if (!this.capturedTransaction) {
        this.capturedTransaction = transaction

        return
      }

      transaction.steps.forEach(step => this.capturedTransaction?.step(step))

      return
    }

    const state = this.state.apply(transaction)
    const selectionHasChanged = !this.state.selection.eq(state.selection)

    this.emit('beforeTransaction', {
      editor: this,
      transaction,
      nextState: state,
    })
    this.view.updateState(state)
    this.emit('transaction', {
      editor: this,
      transaction,
    })

    if (selectionHasChanged) {
      this.emit('selectionUpdate', {
        editor: this,
        transaction,
      })
    }

    const focus = transaction.getMeta('focus')
    const blur = transaction.getMeta('blur')

    if (focus) {
      this.emit('focus', {
        editor: this,
        event: focus.event,
        transaction,
      })
    }

    if (blur) {
      this.emit('blur', {
        editor: this,
        event: blur.event,
        transaction,
      })
    }

    if (!transaction.docChanged || transaction.getMeta('preventUpdate')) {
      return
    }

    this.emit('update', {
      editor: this,
      transaction,
    })
  }

  /**
   * 获取当前选中的节点或标记的属性。
   */
  public getAttributes(nameOrType: string | NodeType | MarkType): Record<string, any> {
    return getAttributes(this.state, nameOrType)
  }

  /**
   * 返回当前选中的节点或标记是否处于活动状态。
   *
   * @param name 节点或标记的名称
   * @param attributes 节点或标记的属性
   */
  public isActive(name: string, attributes?: {}): boolean
  public isActive(attributes: {}): boolean
  public isActive(nameOrAttributes: string, attributesOrUndefined?: {}): boolean {
    const name = typeof nameOrAttributes === 'string' ? nameOrAttributes : null

    const attributes = typeof nameOrAttributes === 'string' ? attributesOrUndefined : nameOrAttributes

    return isActive(this.state, name, attributes)
  }

  /**
   * 获取文档作为 JSON。
   */
  public getJSON(): JSONContent {
    return this.state.doc.toJSON()
  }

  /**
   * 获取文档作为 HTML。
   */
  public getHTML(): string {
    return getHTMLFromFragment(this.state.doc.content, this.schema)
  }

  /**
   * 获取文档作为文本。
   */
  public getText(options?: {
    blockSeparator?: string
    textSerializers?: Record<string, TextSerializer>
  }): string {
    const { blockSeparator = '\n\n', textSerializers = {} } = options || {}

    return getText(this.state.doc, {
      blockSeparator,
      textSerializers: {
        ...getTextSerializersFromSchema(this.schema),
        ...textSerializers,
      },
    })
  }

  /**
   * 检查是否没有内容。
   */
  public get isEmpty(): boolean {
    return isNodeEmpty(this.state.doc)
  }

  /**
   * 获取当前文档的字符数。
   *
   * @deprecated
   */
  public getCharacterCount(): number {
    console.warn(
      '[tiptap warn]: "editor.getCharacterCount()" 已弃用。请使用 "editor.storage.characterCount.characters()" 代替。',
    )

    return this.state.doc.content.size - 2
  }

  /**
   * 销毁编辑器。
   */
  public destroy(): void {
    this.emit('destroy')

    if (this.view) {
      // 清理我们的引用，以防止循环引用，这会导致内存泄漏
      // @ts-ignore
      const dom = this.view.dom as TiptapEditorHTMLElement

      if (dom && dom.editor) {
        delete dom.editor
      }
      this.view.destroy()
    }

    this.removeAllListeners()
  }

  /**
   * 检查编辑器是否已销毁。
   */
  public get isDestroyed(): boolean {
    // @ts-ignore
    return !this.view?.docView
  }

  public $node(selector: string, attributes?: { [key: string]: any }): NodePos | null {
    return this.$doc?.querySelector(selector, attributes) || null
  }

  public $nodes(selector: string, attributes?: { [key: string]: any }): NodePos[] | null {
    return this.$doc?.querySelectorAll(selector, attributes) || null
  }

  public $pos(pos: number) {
    const $pos = this.state.doc.resolve(pos)

    return new NodePos($pos, this)
  }

  get $doc() {
    return this.$pos(0)
  }
}
