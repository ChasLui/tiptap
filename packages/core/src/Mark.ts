import {
  DOMOutputSpec, Mark as ProseMirrorMark, MarkSpec, MarkType,
} from '@tiptap/pm/model'
import { Plugin, Transaction } from '@tiptap/pm/state'

import { Editor } from './Editor.js'
import { getExtensionField } from './helpers/getExtensionField.js'
import { MarkConfig } from './index.js'
import { InputRule } from './InputRule.js'
import { Node } from './Node.js'
import { PasteRule } from './PasteRule.js'
import {
  AnyConfig,
  Attributes,
  Extensions,
  GlobalAttributes,
  KeyboardShortcutCommand,
  ParentConfig,
  RawCommands,
} from './types.js'
import { callOrReturn } from './utilities/callOrReturn.js'
import { mergeDeep } from './utilities/mergeDeep.js'

declare module '@tiptap/core' {
  export interface MarkConfig<Options = any, Storage = any> {
    // @ts-ignore - this is a dynamic key
    [key: string]: any

    /**
     * 扩展名称 -这必须是唯一的。
     * 它将用于识别扩展名。
     *
     * @example 'myExtension'
     */
    name: string

    /**
     * 扩展的优先级。越早，它将被调用，并且优先于其他优先级的扩展名优先。
     * @default 100
     * @example 101
     */
    priority?: number

    /**
     * 此扩展的默认选项。
     * @example
     * defaultOptions: {
     *   myOption: 'foo',
     *   myOtherOption: 10,
     * }
     */
    defaultOptions?: Options

    /**
     * 此方法将向此扩展添加选项。
     * @see https://tiptap.dev/guide/custom-extensions#settings
     * @example
     * addOptions() {
     *  return {
     *    myOption: 'foo',
     *    myOtherOption: 10,
     * }
     */
    addOptions?: (this: {
      name: string
      parent: Exclude<ParentConfig<MarkConfig<Options, Storage>>['addOptions'], undefined>
    }) => Options

    /**
     * 此扩展可以保存数据的默认存储。
     * @see https://tiptap.dev/guide/custom-extensions#storage
     * @example
     * defaultStorage: {
     *   prefetchedUsers: [],
     *   loading: false,
     * }
     */
    addStorage?: (this: {
      name: string
      options: Options
      parent: Exclude<ParentConfig<MarkConfig<Options, Storage>>['addStorage'], undefined>
    }) => Storage

    /**
     * 此函数向特定节点添加全局属性。
     * @see https://tiptap.dev/guide/custom-extensions#global-attributes
     * @example
     * addGlobalAttributes() {
     *   return [
     *     {
             // Extend the following extensions
     *       types: [
     *         'heading',
     *         'paragraph',
     *       ],
     *       // … with those attributes
     *       attributes: {
     *         textAlign: {
     *           default: 'left',
     *           renderHTML: attributes => ({
     *             style: `text-align: ${attributes.textAlign}`,
     *           }),
     *           parseHTML: element => element.style.textAlign || 'left',
     *         },
     *       },
     *     },
     *   ]
     * }
     */
    addGlobalAttributes?: (this: {
      name: string
      options: Options
      storage: Storage
      extensions: (Node | Mark)[]
      parent: ParentConfig<MarkConfig<Options, Storage>>['addGlobalAttributes']
    }) => GlobalAttributes

    /**
     * 此函数向编辑器添加命令。
     * @see https://tiptap.dev/guide/custom-extensions#keyboard-shortcuts
     * @example
     * addCommands() {
     *   return {
     *     myCommand: () => ({ chain }) => chain().setMark('type', 'foo').run(),
     *   }
     * }
     */
    addCommands?: (this: {
      name: string
      options: Options
      storage: Storage
      editor: Editor
      type: MarkType
      parent: ParentConfig<MarkConfig<Options, Storage>>['addCommands']
    }) => Partial<RawCommands>

    /**
     * 此函数注册键盘快捷键。
     * @see https://tiptap.dev/guide/custom-extensions#keyboard-shortcuts
     * @example
     * addKeyboardShortcuts() {
     *   return {
     *     'Mod-l': () => this.editor.commands.toggleBulletList(),
     *   }
     * },
     */
    addKeyboardShortcuts?: (this: {
      name: string
      options: Options
      storage: Storage
      editor: Editor
      type: MarkType
      parent: ParentConfig<MarkConfig<Options, Storage>>['addKeyboardShortcuts']
    }) => {
      [key: string]: KeyboardShortcutCommand
    }

    /**
     * 此函数向编辑器添加输入规则。
     * @see https://tiptap.dev/guide/custom-extensions#input-rules
     * @example
     * addInputRules() {
     *   return [
     *     markInputRule({
     *       find: inputRegex,
     *       type: this.type,
     *     }),
     *   ]
     * },
     */
    addInputRules?: (this: {
      name: string
      options: Options
      storage: Storage
      editor: Editor
      type: MarkType
      parent: ParentConfig<MarkConfig<Options, Storage>>['addInputRules']
    }) => InputRule[]

    /**
     * 此函数向编辑器添加粘贴规则。
     * @see https://tiptap.dev/guide/custom-extensions#paste-rules
     * @example
     * addPasteRules() {
     *   return [
     *     markPasteRule({
     *       find: pasteRegex,
     *       type: this.type,
     *     }),
     *   ]
     * },
     */
    addPasteRules?: (this: {
      name: string
      options: Options
      storage: Storage
      editor: Editor
      type: MarkType
      parent: ParentConfig<MarkConfig<Options, Storage>>['addPasteRules']
    }) => PasteRule[]

    /**
     * 此函数向编辑器添加 Prosemirror 插件。
     * @see https://tiptap.dev/guide/custom-extensions#prosemirror-plugins
     * @example
     * addProseMirrorPlugins() {
     *   return [
     *     customPlugin(),
     *   ]
     * }
     */
    addProseMirrorPlugins?: (this: {
      name: string
      options: Options
      storage: Storage
      editor: Editor
      type: MarkType
      parent: ParentConfig<MarkConfig<Options, Storage>>['addProseMirrorPlugins']
    }) => Plugin[]

    /**
     * 此函数向编辑器添加其他扩展。这对于构建扩展套件非常有用。
     * @example
     * addExtensions() {
     *   return [
     *     BulletList,
     *     OrderedList,
     *     ListItem
     *   ]
     * }
     */
    addExtensions?: (this: {
      name: string
      options: Options
      storage: Storage
      parent: ParentConfig<MarkConfig<Options, Storage>>['addExtensions']
    }) => Extensions

    /**
     * 此函数扩展节点的模式。
     * @example
     * extendNodeSchema() {
     *   return {
     *     group: 'inline',
     *     selectable: false,
     *   }
     * }
     */
    extendNodeSchema?:
      | ((
          this: {
            name: string
            options: Options
            storage: Storage
            parent: ParentConfig<MarkConfig<Options, Storage>>['extendNodeSchema']
          },
          extension: Node,
        ) => Record<string, any>)
      | null

    /**
     * 此函数扩展标记的模式。
     * @example
     * extendMarkSchema() {
     *   return {
     *     group: 'inline',
     *     selectable: false,
     *   }
     * }
     */
    extendMarkSchema?:
      | ((
          this: {
            name: string
            options: Options
            storage: Storage
            parent: ParentConfig<MarkConfig<Options, Storage>>['extendMarkSchema']
          },
          extension: Mark,
        ) => Record<string, any>)
      | null

    /**
     * 编辑器尚未准备好。
     */
    onBeforeCreate?:
      | ((this: {
          name: string
          options: Options
          storage: Storage
          editor: Editor
          type: MarkType
          parent: ParentConfig<MarkConfig<Options, Storage>>['onBeforeCreate']
        }) => void)
      | null

    /**
     * 编辑器已准备就绪。
     */
    onCreate?:
      | ((this: {
          name: string
          options: Options
          storage: Storage
          editor: Editor
          type: MarkType
          parent: ParentConfig<MarkConfig<Options, Storage>>['onCreate']
        }) => void)
      | null

    /**
     * 内容已更改。
     */
    onUpdate?:
      | ((this: {
          name: string
          options: Options
          storage: Storage
          editor: Editor
          type: MarkType
          parent: ParentConfig<MarkConfig<Options, Storage>>['onUpdate']
        }) => void)
      | null

    /**
     * 选择已更改。
     */
    onSelectionUpdate?:
      | ((this: {
          name: string
          options: Options
          storage: Storage
          editor: Editor
          type: MarkType
          parent: ParentConfig<MarkConfig<Options, Storage>>['onSelectionUpdate']
        }) => void)
      | null

    /**
     * 编辑器状态已更改。
     */
    onTransaction?:
      | ((
          this: {
            name: string
            options: Options
            storage: Storage
            editor: Editor
            type: MarkType
            parent: ParentConfig<MarkConfig<Options, Storage>>['onTransaction']
          },
          props: {
            editor: Editor
            transaction: Transaction
          },
        ) => void)
      | null

    /**
     * 编辑器已聚焦。
     */
    onFocus?:
      | ((
          this: {
            name: string
            options: Options
            storage: Storage
            editor: Editor
            type: MarkType
            parent: ParentConfig<MarkConfig<Options, Storage>>['onFocus']
          },
          props: {
            event: FocusEvent
          },
        ) => void)
      | null

    /**
     * 编辑器不再聚焦。
     */
    onBlur?:
      | ((
          this: {
            name: string
            options: Options
            storage: Storage
            editor: Editor
            type: MarkType
            parent: ParentConfig<MarkConfig<Options, Storage>>['onBlur']
          },
          props: {
            event: FocusEvent
          },
        ) => void)
      | null

    /**
     * 编辑器已销毁。
     */
    onDestroy?:
      | ((this: {
          name: string
          options: Options
          storage: Storage
          editor: Editor
          type: MarkType
          parent: ParentConfig<MarkConfig<Options, Storage>>['onDestroy']
        }) => void)
      | null

    /**
     * 在拆分节点后保持标记。
     */
    keepOnSplit?: boolean | (() => boolean)

    /**
     * 包含
     */
    inclusive?:
      | MarkSpec['inclusive']
      | ((this: {
          name: string
          options: Options
          storage: Storage
          parent: ParentConfig<MarkConfig<Options, Storage>>['inclusive']
          editor?: Editor
        }) => MarkSpec['inclusive'])

    /**
     * 排除
     */
    excludes?:
      | MarkSpec['excludes']
      | ((this: {
          name: string
          options: Options
          storage: Storage
          parent: ParentConfig<MarkConfig<Options, Storage>>['excludes']
          editor?: Editor
        }) => MarkSpec['excludes'])

    /**
     * 将此标记标记为可退出。
     */
    exitable?: boolean | (() => boolean)

    /**
     * 组
     */
    group?:
      | MarkSpec['group']
      | ((this: {
          name: string
          options: Options
          storage: Storage
          parent: ParentConfig<MarkConfig<Options, Storage>>['group']
          editor?: Editor
        }) => MarkSpec['group'])

    /**
     * 跨度
     */
    spanning?:
      | MarkSpec['spanning']
      | ((this: {
          name: string
          options: Options
          storage: Storage
          parent: ParentConfig<MarkConfig<Options, Storage>>['spanning']
          editor?: Editor
        }) => MarkSpec['spanning'])

    /**
     * 代码
     */
    code?:
      | boolean
      | ((this: {
          name: string
          options: Options
          storage: Storage
          parent: ParentConfig<MarkConfig<Options, Storage>>['code']
          editor?: Editor
        }) => boolean)

    /**
     * 解析 HTML
     */
    parseHTML?: (this: {
      name: string
      options: Options
      storage: Storage
      parent: ParentConfig<MarkConfig<Options, Storage>>['parseHTML']
      editor?: Editor
    }) => MarkSpec['parseDOM']

    /**
     * 渲染 HTML
     */
    renderHTML?:
      | ((
          this: {
            name: string
            options: Options
            storage: Storage
            parent: ParentConfig<MarkConfig<Options, Storage>>['renderHTML']
            editor?: Editor
          },
          props: {
            mark: ProseMirrorMark
            HTMLAttributes: Record<string, any>
          },
        ) => DOMOutputSpec)
      | null

    /**
     * 属性
     */
    addAttributes?: (this: {
      name: string
      options: Options
      storage: Storage
      parent: ParentConfig<MarkConfig<Options, Storage>>['addAttributes']
      editor?: Editor
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    }) => Attributes | {}
  }
}

/**
 * 标记类用于创建自定义标记扩展。
 * @see https://tiptap.dev/api/extensions#create-a-new-extension
 */
export class Mark<Options = any, Storage = any> {
  type = 'mark'

  name = 'mark'

  parent: Mark | null = null

  child: Mark | null = null

  options: Options

  storage: Storage

  config: MarkConfig = {
    name: this.name,
    defaultOptions: {},
  }

  constructor(config: Partial<MarkConfig<Options, Storage>> = {}) {
    this.config = {
      ...this.config,
      ...config,
    }

    this.name = this.config.name

    if (config.defaultOptions && Object.keys(config.defaultOptions).length > 0) {
      console.warn(
        `[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${this.name}".`,
      )
    }

    // TODO: remove `addOptions` fallback
    this.options = this.config.defaultOptions

    if (this.config.addOptions) {
      this.options = callOrReturn(
        getExtensionField<AnyConfig['addOptions']>(this, 'addOptions', {
          name: this.name,
        }),
      )
    }

    this.storage = callOrReturn(
      getExtensionField<AnyConfig['addStorage']>(this, 'addStorage', {
        name: this.name,
        options: this.options,
      }),
    ) || {}
  }

  static create<O = any, S = any>(config: Partial<MarkConfig<O, S>> = {}) {
    return new Mark<O, S>(config)
  }

  configure(options: Partial<Options> = {}) {
    // 返回一个新实例，以便我们可以使用相同的扩展
    // 使用不同的调用 `configure`
    const extension = this.extend<Options, Storage>({
      ...this.config,
      addOptions: () => {
        return mergeDeep(this.options as Record<string, any>, options) as Options
      },
    })

    // 始终保留当前名称
    extension.name = this.name
    // 将父级设置为我们的父级
    extension.parent = this.parent

    return extension
  }

  extend<ExtendedOptions = Options, ExtendedStorage = Storage>(
    extendedConfig: Partial<MarkConfig<ExtendedOptions, ExtendedStorage>> = {},
  ) {
    const extension = new Mark<ExtendedOptions, ExtendedStorage>(extendedConfig)

    extension.parent = this

    this.child = extension

    extension.name = extendedConfig.name ? extendedConfig.name : extension.parent.name

    if (extendedConfig.defaultOptions && Object.keys(extendedConfig.defaultOptions).length > 0) {
      console.warn(
        `[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${extension.name}".`,
      )
    }

    extension.options = callOrReturn(
      getExtensionField<AnyConfig['addOptions']>(extension, 'addOptions', {
        name: extension.name,
      }),
    )

    extension.storage = callOrReturn(
      getExtensionField<AnyConfig['addStorage']>(extension, 'addStorage', {
        name: extension.name,
        options: extension.options,
      }),
    )

    return extension
  }

  static handleExit({ editor, mark }: { editor: Editor; mark: Mark }) {
    const { tr } = editor.state
    const currentPos = editor.state.selection.$from
    const isAtEnd = currentPos.pos === currentPos.end()

    if (isAtEnd) {
      const currentMarks = currentPos.marks()
      const isInMark = !!currentMarks.find(m => m?.type.name === mark.name)

      if (!isInMark) {
        return false
      }

      const removeMark = currentMarks.find(m => m?.type.name === mark.name)

      if (removeMark) {
        tr.removeStoredMark(removeMark)
      }
      tr.insertText(' ', currentPos.pos)

      editor.view.dispatch(tr)

      return true
    }

    return false
  }
}
