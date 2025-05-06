import { Plugin, Transaction } from '@tiptap/pm/state'

import { Editor } from './Editor.js'
import { getExtensionField } from './helpers/getExtensionField.js'
import { ExtensionConfig } from './index.js'
import { InputRule } from './InputRule.js'
import { Mark } from './Mark.js'
import { Node } from './Node.js'
import { PasteRule } from './PasteRule.js'
import {
  AnyConfig,
  Extensions,
  GlobalAttributes,
  KeyboardShortcutCommand,
  ParentConfig,
  RawCommands,
} from './types.js'
import { callOrReturn } from './utilities/callOrReturn.js'
import { mergeDeep } from './utilities/mergeDeep.js'

declare module '@tiptap/core' {
  interface ExtensionConfig<Options = any, Storage = any> {
    // @ts-ignore - 这是一个动态key
    [key: string]: any

    /**
     * 扩展名称 - 这必须是唯一的。
     * 它将用于识别扩展。
     *
     * @example 'myExtension'
     */
    name: string

    /**
     * 扩展的优先级。越高，它将被调用，并且优先于其他优先级的扩展名优先。
     * @default 100
     * @example 101
     */
    priority?: number

    /**
     * 扩展的默认选项。
     * @example
     * defaultOptions: {
     *   myOption: 'foo',
     *   myOtherOption: 10,
     * }
     */
    defaultOptions?: Options

    /**
     * 此方法将向此扩展添加选项
     * @see https://tiptap.dev/docs/editor/guide/custom-extensions#settings
     * @example
     * addOptions() {
     *  return {
     *    myOption: 'foo',
     *    myOtherOption: 10,
     * }
     */
    addOptions?: (this: {
      name: string
      parent: Exclude<ParentConfig<ExtensionConfig<Options, Storage>>['addOptions'], undefined>
    }) => Options

    /**
     * 此扩展可以保存数据的默认存储。
     * @see https://tiptap.dev/docs/editor/guide/custom-extensions#storage
     * @example
     * defaultStorage: {
     *   prefetchedUsers: [],
     *   loading: false,
     * }
     */
    addStorage?: (this: {
      name: string
      options: Options
      parent: Exclude<ParentConfig<ExtensionConfig<Options, Storage>>['addStorage'], undefined>
    }) => Storage

    /**
     * 此函数向特定节点添加全局属性。
     * @see https://tiptap.dev/docs/editor/guide/custom-extensions#global-attributes
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
      parent: ParentConfig<ExtensionConfig<Options, Storage>>['addGlobalAttributes']
    }) => GlobalAttributes

    /**
     * 此函数向编辑器添加命令
     * @see https://tiptap.dev/docs/editor/guide/custom-extensions#commands
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
      parent: ParentConfig<ExtensionConfig<Options, Storage>>['addCommands']
    }) => Partial<RawCommands>

    /**
     * 此函数注册键盘快捷键。
     * @see https://tiptap.dev/docs/editor/guide/custom-extensions#keyboard-shortcuts
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
      parent: ParentConfig<ExtensionConfig<Options, Storage>>['addKeyboardShortcuts']
    }) => {
      [key: string]: KeyboardShortcutCommand
    }

    /**
     * 此函数向编辑器添加输入规则。
     * @see https://tiptap.dev/docs/editor/guide/custom-extensions#input-rules
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
      parent: ParentConfig<ExtensionConfig<Options, Storage>>['addInputRules']
    }) => InputRule[]

    /**
     * 此函数向编辑器添加粘贴规则。
     * @see https://tiptap.dev/docs/editor/guide/custom-extensions#paste-rules
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
      parent: ParentConfig<ExtensionConfig<Options, Storage>>['addPasteRules']
    }) => PasteRule[]

    /**
     * 此函数向编辑器添加 Prosemirror 插件
     * @see https://tiptap.dev/docs/editor/guide/custom-extensions#prosemirror-plugins
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
      parent: ParentConfig<ExtensionConfig<Options, Storage>>['addProseMirrorPlugins']
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
      parent: ParentConfig<ExtensionConfig<Options, Storage>>['addExtensions']
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
            parent: ParentConfig<ExtensionConfig<Options, Storage>>['extendNodeSchema']
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
            parent: ParentConfig<ExtensionConfig<Options, Storage>>['extendMarkSchema']
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
          parent: ParentConfig<ExtensionConfig<Options, Storage>>['onBeforeCreate']
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
          parent: ParentConfig<ExtensionConfig<Options, Storage>>['onCreate']
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
          parent: ParentConfig<ExtensionConfig<Options, Storage>>['onUpdate']
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
          parent: ParentConfig<ExtensionConfig<Options, Storage>>['onSelectionUpdate']
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
            parent: ParentConfig<ExtensionConfig<Options, Storage>>['onTransaction']
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
            parent: ParentConfig<ExtensionConfig<Options, Storage>>['onFocus']
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
            parent: ParentConfig<ExtensionConfig<Options, Storage>>['onBlur']
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
          parent: ParentConfig<ExtensionConfig<Options, Storage>>['onDestroy']
        }) => void)
      | null
  }
}

/**
 * Extension 类是所有扩展的基础类。
 * @see https://tiptap.dev/api/extensions#create-a-new-extension
 */
export class Extension<Options = any, Storage = any> {
  type = 'extension'

  name = 'extension'

  parent: Extension | null = null

  child: Extension | null = null

  options: Options

  storage: Storage

  config: ExtensionConfig = {
    name: this.name,
    defaultOptions: {},
  }

  constructor(config: Partial<ExtensionConfig<Options, Storage>> = {}) {
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

  static create<O = any, S = any>(config: Partial<ExtensionConfig<O, S>> = {}) {
    return new Extension<O, S>(config)
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
    extendedConfig: Partial<ExtensionConfig<ExtendedOptions, ExtendedStorage>> = {},
  ) {
    const extension = new Extension<ExtendedOptions, ExtendedStorage>({ ...this.config, ...extendedConfig })

    extension.parent = this

    this.child = extension

    extension.name = extendedConfig.name ? extendedConfig.name : extension.parent.name

    if (extendedConfig.defaultOptions && Object.keys(extendedConfig.defaultOptions).length > 0) {
      console.warn(
        `[tiptap warn]: BREAKING CHANGE: "defaultOptions" 已弃用。请改用 "addOptions" 。在扩展中： "${extension.name}" 中找到。`,
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
}
