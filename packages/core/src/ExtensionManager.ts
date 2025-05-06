import { keymap } from '@tiptap/pm/keymap'
import { Schema } from '@tiptap/pm/model'
import { Plugin } from '@tiptap/pm/state'
import { NodeViewConstructor } from '@tiptap/pm/view'

import type { Editor } from './Editor.js'
import { getAttributesFromExtensions } from './helpers/getAttributesFromExtensions.js'
import { getExtensionField } from './helpers/getExtensionField.js'
import { getNodeType } from './helpers/getNodeType.js'
import { getRenderedAttributes } from './helpers/getRenderedAttributes.js'
import { getSchemaByResolvedExtensions } from './helpers/getSchemaByResolvedExtensions.js'
import { getSchemaTypeByName } from './helpers/getSchemaTypeByName.js'
import { isExtensionRulesEnabled } from './helpers/isExtensionRulesEnabled.js'
import { splitExtensions } from './helpers/splitExtensions.js'
import type { NodeConfig } from './index.js'
import { InputRule, inputRulesPlugin } from './InputRule.js'
import { Mark } from './Mark.js'
import { PasteRule, pasteRulesPlugin } from './PasteRule.js'
import { AnyConfig, Extensions, RawCommands } from './types.js'
import { callOrReturn } from './utilities/callOrReturn.js'
import { findDuplicates } from './utilities/findDuplicates.js'

export class ExtensionManager {
  editor: Editor

  schema: Schema

  extensions: Extensions

  splittableMarks: string[] = []

  constructor(extensions: Extensions, editor: Editor) {
    this.editor = editor
    this.extensions = ExtensionManager.resolve(extensions)
    this.schema = getSchemaByResolvedExtensions(this.extensions, editor)
    this.setupExtensions()
  }

  /**
   * 返回一个扁平化和排序的扩展列表，同时检查重复的扩展并警告用户。
   * @param extensions 一个 Tiptap 扩展的数组
   * @returns 一个扁平化和排序的 Tiptap 扩展数组
   */
  static resolve(extensions: Extensions): Extensions {
    const resolvedExtensions = ExtensionManager.sort(ExtensionManager.flatten(extensions))
    const duplicatedNames = findDuplicates(resolvedExtensions.map(extension => extension.name))

    if (duplicatedNames.length) {
      console.warn(
        `[tiptap warn]: Duplicate extension names found: [${duplicatedNames
          .map(item => `'${item}'`)
          .join(', ')}]. This can lead to issues.`,
      )
    }

    return resolvedExtensions
  }

  /**
   * 通过遍历 `addExtensions` 字段创建一个扁平化的扩展数组。
   * @param extensions 一个 Tiptap 扩展的数组
   * @returns 一个扁平化的 Tiptap 扩展数组
   */
  static flatten(extensions: Extensions): Extensions {
    return (
      extensions
        .map(extension => {
          const context = {
            name: extension.name,
            options: extension.options,
            storage: extension.storage,
          }

          const addExtensions = getExtensionField<AnyConfig['addExtensions']>(
            extension,
            'addExtensions',
            context,
          )

          if (addExtensions) {
            return [extension, ...this.flatten(addExtensions())]
          }

          return extension
        })
        // `Infinity` 会破坏 TypeScript，所以我们设置一个足够高的数字
        .flat(10)
    )
  }

  /**
   * 按优先级排序扩展。
   * @param extensions 一个 Tiptap 扩展的数组
   * @returns 一个按优先级排序的 Tiptap 扩展数组
   */
  static sort(extensions: Extensions): Extensions {
    const defaultPriority = 100

    return extensions.sort((a, b) => {
      const priorityA = getExtensionField<AnyConfig['priority']>(a, 'priority') || defaultPriority
      const priorityB = getExtensionField<AnyConfig['priority']>(b, 'priority') || defaultPriority

      if (priorityA > priorityB) {
        return -1
      }

      if (priorityA < priorityB) {
        return 1
      }

      return 0
    })
  }

  /**
   * 获取所有扩展的命令。
   * @returns 一个包含所有命令的对象，其中键是命令名称，值是命令函数
   */
  get commands(): RawCommands {
    return this.extensions.reduce((commands, extension) => {
      const context = {
        name: extension.name,
        options: extension.options,
        storage: extension.storage,
        editor: this.editor,
        type: getSchemaTypeByName(extension.name, this.schema),
      }

      const addCommands = getExtensionField<AnyConfig['addCommands']>(
        extension,
        'addCommands',
        context,
      )

      if (!addCommands) {
        return commands
      }

      return {
        ...commands,
        ...addCommands(),
      }
    }, {} as RawCommands)
  }

  /**
   * 获取所有注册的 Prosemirror 插件。
   * @returns 一个 Prosemirror 插件的数组
   */
  get plugins(): Plugin[] {
    const { editor } = this

    // 在 ProseMirror 中，数组中的第一个插件首先执行。
    // 在 Tiptap 中，我们提供了覆盖插件的能力，
    // 所以感觉更自然的是先运行数组末尾的插件。
    // 这就是为什么我们要反转 `extensions` 数组并再次按 `priority` 选项排序。
    const extensions = ExtensionManager.sort([...this.extensions].reverse())

    const inputRules: InputRule[] = []
    const pasteRules: PasteRule[] = []

    const allPlugins = extensions
      .map(extension => {
        const context = {
          name: extension.name,
          options: extension.options,
          storage: extension.storage,
          editor,
          type: getSchemaTypeByName(extension.name, this.schema),
        }

        const plugins: Plugin[] = []

        const addKeyboardShortcuts = getExtensionField<AnyConfig['addKeyboardShortcuts']>(
          extension,
          'addKeyboardShortcuts',
          context,
        )

        let defaultBindings: Record<string, () => boolean> = {}

        // 绑定退出处理
        if (extension.type === 'mark' && getExtensionField<AnyConfig['exitable']>(extension, 'exitable', context)) {
          defaultBindings.ArrowRight = () => Mark.handleExit({ editor, mark: extension as Mark })
        }

        if (addKeyboardShortcuts) {
          const bindings = Object.fromEntries(
            Object.entries(addKeyboardShortcuts()).map(([shortcut, method]) => {
              return [shortcut, () => method({ editor })]
            }),
          )

          defaultBindings = { ...defaultBindings, ...bindings }
        }

        const keyMapPlugin = keymap(defaultBindings)

        plugins.push(keyMapPlugin)

        const addInputRules = getExtensionField<AnyConfig['addInputRules']>(
          extension,
          'addInputRules',
          context,
        )

        if (isExtensionRulesEnabled(extension, editor.options.enableInputRules) && addInputRules) {
          inputRules.push(...addInputRules())
        }

        const addPasteRules = getExtensionField<AnyConfig['addPasteRules']>(
          extension,
          'addPasteRules',
          context,
        )

        if (isExtensionRulesEnabled(extension, editor.options.enablePasteRules) && addPasteRules) {
          pasteRules.push(...addPasteRules())
        }

        const addProseMirrorPlugins = getExtensionField<AnyConfig['addProseMirrorPlugins']>(
          extension,
          'addProseMirrorPlugins',
          context,
        )

        if (addProseMirrorPlugins) {
          const proseMirrorPlugins = addProseMirrorPlugins()

          plugins.push(...proseMirrorPlugins)
        }

        return plugins
      })
      .flat()

    return [
      inputRulesPlugin({
        editor,
        rules: inputRules,
      }),
      ...pasteRulesPlugin({
        editor,
        rules: pasteRules,
      }),
      ...allPlugins,
    ]
  }

  /**
   * 获取所有扩展的属性。
   * @returns 一个属性的数组
   */
  get attributes() {
    return getAttributesFromExtensions(this.extensions)
  }

  /**
   * 获取所有扩展的节点视图。
   * @returns 一个包含所有节点视图的对象，其中键是节点名称，值是节点视图函数
   */
  get nodeViews(): Record<string, NodeViewConstructor> {
    const { editor } = this
    const { nodeExtensions } = splitExtensions(this.extensions)

    return Object.fromEntries(
      nodeExtensions
        .filter(extension => !!getExtensionField(extension, 'addNodeView'))
        .map(extension => {
          const extensionAttributes = this.attributes.filter(
            attribute => attribute.type === extension.name,
          )
          const context = {
            name: extension.name,
            options: extension.options,
            storage: extension.storage,
            editor,
            type: getNodeType(extension.name, this.schema),
          }
          const addNodeView = getExtensionField<NodeConfig['addNodeView']>(
            extension,
            'addNodeView',
            context,
          )

          if (!addNodeView) {
            return []
          }

          const nodeview: NodeViewConstructor = (
            node,
            view,
            getPos,
            decorations,
            innerDecorations,
          ) => {
            const HTMLAttributes = getRenderedAttributes(node, extensionAttributes)

            return addNodeView()({
              // pass-through
              node,
              view,
              getPos: getPos as () => number,
              decorations,
              innerDecorations,
              // tiptap-specific
              editor,
              extension,
              HTMLAttributes,
            })
          }

          return [extension.name, nodeview]
        }),
    )
  }

  /**
   * 遍历所有扩展，创建扩展存储并设置标记，并绑定编辑器事件监听器。
   */
  private setupExtensions() {
    this.extensions.forEach(extension => {
      // 在编辑器中存储扩展存储
      this.editor.extensionStorage[extension.name] = extension.storage

      const context = {
        name: extension.name,
        options: extension.options,
        storage: extension.storage,
        editor: this.editor,
        type: getSchemaTypeByName(extension.name, this.schema),
      }

      if (extension.type === 'mark') {
        const keepOnSplit = callOrReturn(getExtensionField(extension, 'keepOnSplit', context)) ?? true

        if (keepOnSplit) {
          this.splittableMarks.push(extension.name)
        }
      }

      const onBeforeCreate = getExtensionField<AnyConfig['onBeforeCreate']>(
        extension,
        'onBeforeCreate',
        context,
      )
      const onCreate = getExtensionField<AnyConfig['onCreate']>(extension, 'onCreate', context)
      const onUpdate = getExtensionField<AnyConfig['onUpdate']>(extension, 'onUpdate', context)
      const onSelectionUpdate = getExtensionField<AnyConfig['onSelectionUpdate']>(
        extension,
        'onSelectionUpdate',
        context,
      )
      const onTransaction = getExtensionField<AnyConfig['onTransaction']>(
        extension,
        'onTransaction',
        context,
      )
      const onFocus = getExtensionField<AnyConfig['onFocus']>(extension, 'onFocus', context)
      const onBlur = getExtensionField<AnyConfig['onBlur']>(extension, 'onBlur', context)
      const onDestroy = getExtensionField<AnyConfig['onDestroy']>(extension, 'onDestroy', context)

      if (onBeforeCreate) {
        this.editor.on('beforeCreate', onBeforeCreate)
      }

      if (onCreate) {
        this.editor.on('create', onCreate)
      }

      if (onUpdate) {
        this.editor.on('update', onUpdate)
      }

      if (onSelectionUpdate) {
        this.editor.on('selectionUpdate', onSelectionUpdate)
      }

      if (onTransaction) {
        this.editor.on('transaction', onTransaction)
      }

      if (onFocus) {
        this.editor.on('focus', onFocus)
      }

      if (onBlur) {
        this.editor.on('blur', onBlur)
      }

      if (onDestroy) {
        this.editor.on('destroy', onDestroy)
      }
    })
  }
}
