import {
  DOMOutputSpec, Node as ProseMirrorNode, NodeSpec, NodeType,
} from '@tiptap/pm/model'
import { Plugin, Transaction } from '@tiptap/pm/state'

import { Editor } from './Editor.js'
import { getExtensionField } from './helpers/getExtensionField.js'
import { NodeConfig } from './index.js'
import { InputRule } from './InputRule.js'
import { Mark } from './Mark.js'
import { PasteRule } from './PasteRule.js'
import {
  AnyConfig,
  Attributes,
  Extensions,
  GlobalAttributes,
  KeyboardShortcutCommand,
  NodeViewRenderer,
  ParentConfig,
  RawCommands,
} from './types.js'
import { callOrReturn } from './utilities/callOrReturn.js'
import { mergeDeep } from './utilities/mergeDeep.js'

declare module '@tiptap/core' {
  interface NodeConfig<Options = any, Storage = any> {
    // @ts-ignore - 这是一个动态密钥
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
      parent: Exclude<ParentConfig<NodeConfig<Options, Storage>>['addOptions'], undefined>
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
      parent: Exclude<ParentConfig<NodeConfig<Options, Storage>>['addStorage'], undefined>
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
      parent: ParentConfig<NodeConfig<Options, Storage>>['addGlobalAttributes']
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
      type: NodeType
      parent: ParentConfig<NodeConfig<Options, Storage>>['addCommands']
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
      type: NodeType
      parent: ParentConfig<NodeConfig<Options, Storage>>['addKeyboardShortcuts']
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
      type: NodeType
      parent: ParentConfig<NodeConfig<Options, Storage>>['addInputRules']
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
      type: NodeType
      parent: ParentConfig<NodeConfig<Options, Storage>>['addPasteRules']
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
      type: NodeType
      parent: ParentConfig<NodeConfig<Options, Storage>>['addProseMirrorPlugins']
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
      parent: ParentConfig<NodeConfig<Options, Storage>>['addExtensions']
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
            parent: ParentConfig<NodeConfig<Options, Storage>>['extendNodeSchema']
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
            parent: ParentConfig<NodeConfig<Options, Storage>>['extendMarkSchema']
            editor?: Editor
          },
          extension: Node,
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
          type: NodeType
          parent: ParentConfig<NodeConfig<Options, Storage>>['onBeforeCreate']
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
          type: NodeType
          parent: ParentConfig<NodeConfig<Options, Storage>>['onCreate']
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
          type: NodeType
          parent: ParentConfig<NodeConfig<Options, Storage>>['onUpdate']
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
          type: NodeType
          parent: ParentConfig<NodeConfig<Options, Storage>>['onSelectionUpdate']
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
            type: NodeType
            parent: ParentConfig<NodeConfig<Options, Storage>>['onTransaction']
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
            type: NodeType
            parent: ParentConfig<NodeConfig<Options, Storage>>['onFocus']
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
            type: NodeType
            parent: ParentConfig<NodeConfig<Options, Storage>>['onBlur']
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
          type: NodeType
          parent: ParentConfig<NodeConfig<Options, Storage>>['onDestroy']
        }) => void)
      | null

    /**
     * 节点视图
     */
    addNodeView?:
      | ((this: {
          name: string
          options: Options
          storage: Storage
          editor: Editor
          type: NodeType
          parent: ParentConfig<NodeConfig<Options, Storage>>['addNodeView']
        }) => NodeViewRenderer)
      | null

    /**
     * 定义此节点是否应为顶级节点（doc）
     * @default false
     * @example true
     */
    topNode?: boolean

    /**
     * 此节点的内容表达式，如 [schema](/docs/guide/#schema.content_expressions) 中所述。
     * 当没有给出时，节点不允许任何内容。
     *
     * 你可以在 Prosemirror 文档中了解更多关于它的信息
     * @see https://prosemirror.net/docs/guide/#schema.content_expressions
     * @default undefined
     * @example content: 'block+'
     * @example content: 'headline paragraph block*'
     */
    content?:
      | NodeSpec['content']
      | ((this: {
          name: string
          options: Options
          storage: Storage
          parent: ParentConfig<NodeConfig<Options, Storage>>['content']
          editor?: Editor
        }) => NodeSpec['content'])

    /**
     * 此节点中允许的标记。可以是空格分隔的字符串，引用标记名称或组，`"_"`
     * 明确允许所有标记，或 `""` 禁止标记。当没有给出时，具有内联内容的节点默认允许所有标记，其他节点默认不允许标记。
     *
     * @example marks: 'strong em'
     */
    marks?:
      | NodeSpec['marks']
      | ((this: {
          name: string
          options: Options
          storage: Storage
          parent: ParentConfig<NodeConfig<Options, Storage>>['marks']
          editor?: Editor
        }) => NodeSpec['marks'])

    /**
     * 此节点所属的组或空格分隔的组，可以在内容表达式中引用，
     * 在 schema 中。
     *
     * 默认情况下，Tiptap 使用组 'block' 和 'inline' 为节点。你也可以使用自定义组来将特定节点组合在一起，并处理它们在您的 schema 中。
     * @example group: 'block'
     * @example group: 'inline'
     * @example group: 'customBlock' // 这使用了一个自定义组
     */
    group?:
      | NodeSpec['group']
      | ((this: {
          name: string
          options: Options
          storage: Storage
          parent: ParentConfig<NodeConfig<Options, Storage>>['group']
          editor?: Editor
        }) => NodeSpec['group'])

    /**
     * 应设置为 true 以表示此节点为内联节点。（隐含为文本节点。）
     */
    inline?:
      | NodeSpec['inline']
      | ((this: {
          name: string
          options: Options
          storage: Storage
          parent: ParentConfig<NodeConfig<Options, Storage>>['inline']
          editor?: Editor
        }) => NodeSpec['inline'])

    /**
     * 可以设置为 true 以表示，尽管这不是 [叶子节点](https://prosemirror.net/docs/ref/#model.NodeType.isLeaf)，但它没有直接可编辑的内容，并且应该在视图中被视为一个单元。
     *
     * @example atom: true
     */
    atom?:
      | NodeSpec['atom']
      | ((this: {
          name: string
          options: Options
          storage: Storage
          parent: ParentConfig<NodeConfig<Options, Storage>>['atom']
          editor?: Editor
        }) => NodeSpec['atom'])

    /**
     * 控制此类型节点是否可以作为 [节点选择](https://prosemirror.net/docs/ref/#state.NodeSelection) 选择。默认情况下，非文本节点为 true。
     *
     * @default true
     * @example selectable: false
     */
    selectable?:
      | NodeSpec['selectable']
      | ((this: {
          name: string
          options: Options
          storage: Storage
          parent: ParentConfig<NodeConfig<Options, Storage>>['selectable']
          editor?: Editor
        }) => NodeSpec['selectable'])

    /**
     * 确定是否可以拖动此类型节点而不选择它。默认情况下为 false。
     *
     * @default: false
     * @example: draggable: true
     */
    draggable?:
      | NodeSpec['draggable']
      | ((this: {
          name: string
          options: Options
          storage: Storage
          parent: ParentConfig<NodeConfig<Options, Storage>>['draggable']
          editor?: Editor
        }) => NodeSpec['draggable'])

    /**
     * 可以用来表示此节点包含代码，这会导致某些命令的行为有所不同。
     */
    code?:
      | NodeSpec['code']
      | ((this: {
          name: string
          options: Options
          storage: Storage
          parent: ParentConfig<NodeConfig<Options, Storage>>['code']
          editor?: Editor
        }) => NodeSpec['code'])

    /**
     * 控制此节点中的空格如何解析。默认值为 `"normal"`，这会导致 [DOM 解析器](https://prosemirror.net/docs/ref/#model.DOMParser) 在正常模式下崩溃空格，并将其标准化（用空格替换新行等），否则。 `"pre"` 导致解析器保留节点内的空格。
     * 当此选项未给出，但 [`code`](https://prosemirror.net/docs/ref/#model.NodeSpec.code) 为 true，`whitespace` 将默认为 `"pre"`。
     * 请注意，此选项不会影响节点的渲染方式——应通过 `toDOM` 和/或样式处理。
     */
    whitespace?:
      | NodeSpec['whitespace']
      | ((this: {
          name: string
          options: Options
          storage: Storage
          parent: ParentConfig<NodeConfig<Options, Storage>>['whitespace']
          editor?: Editor
        }) => NodeSpec['whitespace'])

    /**
     * 允许将 **单个** 节点设置为行分隔符（例如 `hardBreak`）。
     * 当在具有 `"pre"` 设置为空格的块类型之间转换时，
     * 不支持行分隔符节点（例如 `codeBlock`）和其他支持行分隔符节点（例如 `paragraphs`）的块类型时，
     * 此节点将用于行分隔符，而不是删除换行符。
     *
     * 请参阅 [linebreakReplacement](https://prosemirror.net/docs/ref/#model.NodeSpec.linebreakReplacement)。
     */
    linebreakReplacement?:
      | NodeSpec['linebreakReplacement']
      | ((this: {
          name: string
          options: Options
          storage: Storage
          parent: ParentConfig<NodeConfig<Options, Storage>>['linebreakReplacement']
          editor?: Editor
        }) => NodeSpec['linebreakReplacement'])

    /**
     * 启用时，同时启用 [`definingAsContext`](https://prosemirror.net/docs/ref/#model.NodeSpec.definingAsContext) 和 [`definingForContent`](https://prosemirror.net/docs/ref/#model.NodeSpec.definingForContent)。
     *
     * @default false
     * @example isolating: true
     */
    defining?:
      | NodeSpec['defining']
      | ((this: {
          name: string
          options: Options
          storage: Storage
          parent: ParentConfig<NodeConfig<Options, Storage>>['defining']
          editor?: Editor
        }) => NodeSpec['defining'])

    /**
     * 启用时（默认值为 false），此类型节点的两侧
     * 作为边界，常规编辑操作（如退格或提升）不会跨越。
     * 一个应该可能启用此选项的节点示例是表格单元格。
     */
    isolating?:
      | NodeSpec['isolating']
      | ((this: {
          name: string
          options: Options
          storage: Storage
          parent: ParentConfig<NodeConfig<Options, Storage>>['isolating']
          editor?: Editor
        }) => NodeSpec['isolating'])

    /**
     * 将 DOM 解析器信息与此节点关联，可以
     * 由 [`DOMParser.fromSchema`](https://prosemirror.net/docs/ref/#model.DOMParser^fromSchema) 自动推导出解析器。
     * 在规则中的 `node` 字段是隐含的（此节点的名称将自动填充）。
     * 如果你提供自己的解析器，你不需要也在你的 schema 中指定解析规则。
     *
     * @example parseHTML: [{ tag: 'div', attrs: { 'data-id': 'my-block' } }]
     */
    parseHTML?: (this: {
      name: string
      options: Options
      storage: Storage
      parent: ParentConfig<NodeConfig<Options, Storage>>['parseHTML']
      editor?: Editor
    }) => NodeSpec['parseDOM']

    /**
     * 描述一个 DOM 结构。可以是字符串，解释为文本节点，DOM 节点，解释为它本身，`{dom, contentDOM}` 对象，或数组。
     *
     * 数组描述一个 DOM 元素。数组中的第一个值应该是一个字符串——DOM 元素的名称，可选地以命名空间 URL 和空格为前缀。如果第二个元素是普通对象，则解释为元素的属性集。
     * 任何后续元素（包括第二个元素如果不是属性）都被解释为 DOM 元素的子元素，并且必须是有效的 `DOMOutputSpec` 值，或者零。
     *
     * 零（发音为“洞”）用于指示节点子节点的插入位置。如果它在输出规范中出现，它应该是其父元素中的唯一子元素。
     *
     * 数组描述一个 DOM 元素。数组中的第一个值应该是一个字符串——DOM 元素的名称，可选地以命名空间 URL 和空格为前缀。如果第二个元素是普通对象，则解释为元素的属性集。
     * 任何后续元素（包括第二个元素如果不是属性）都被解释为 DOM 元素的子元素，并且必须是有效的 `DOMOutputSpec` 值，或者零。
     *
     * 零（发音为“洞”）用于指示节点子节点的插入位置。如果它在输出规范中出现，它应该是其父元素中的唯一子元素。
     *
     * @example toDOM: ['div[data-id="my-block"]', { class: 'my-block' }, 0]
     */
    renderHTML?:
      | ((
          this: {
            name: string
            options: Options
            storage: Storage
            parent: ParentConfig<NodeConfig<Options, Storage>>['renderHTML']
            editor?: Editor
          },
          props: {
            node: ProseMirrorNode
            HTMLAttributes: Record<string, any>
          },
        ) => DOMOutputSpec)
      | null

    /**
     * 将节点渲染为文本
     * @example renderText: () => 'foo
     */
    renderText?:
      | ((
          this: {
            name: string
            options: Options
            storage: Storage
            parent: ParentConfig<NodeConfig<Options, Storage>>['renderText']
            editor?: Editor
          },
          props: {
            node: ProseMirrorNode
            pos: number
            parent: ProseMirrorNode
            index: number
          },
        ) => string)
      | null

    /**
     * 向节点添加属性
     * @example addAttributes: () => ({ class: 'foo' })
     */
    addAttributes?: (this: {
      name: string
      options: Options
      storage: Storage
      parent: ParentConfig<NodeConfig<Options, Storage>>['addAttributes']
      editor?: Editor
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    }) => Attributes | {}
  }
}

/**
 * 节点类用于创建自定义节点扩展。
 * @see https://tiptap.dev/api/extensions#create-a-new-extension
 */
export class Node<Options = any, Storage = any> {
  type = 'node'

  name = 'node'

  parent: Node | null = null

  child: Node | null = null

  options: Options

  storage: Storage

  config: NodeConfig = {
    name: this.name,
    defaultOptions: {},
  }

  constructor(config: Partial<NodeConfig<Options, Storage>> = {}) {
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

  static create<O = any, S = any>(config: Partial<NodeConfig<O, S>> = {}) {
    return new Node<O, S>(config)
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
    extendedConfig: Partial<NodeConfig<ExtendedOptions, ExtendedStorage>> = {},
  ) {
    const extension = new Node<ExtendedOptions, ExtendedStorage>(extendedConfig)

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
}
