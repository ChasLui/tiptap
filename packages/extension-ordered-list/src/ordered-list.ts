import { mergeAttributes, Node, wrappingInputRule } from '@tiptap/core'

const ListItemName = 'listItem'
const TextStyleName = 'textStyle'

export interface OrderedListOptions {
  /**
   * 列表项的节点类型名称。
   * @default 'listItem'
   * @example 'myListItem'
   */
  itemTypeName: string,

  /**
   * 有序列表节点的 HTML 属性。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>,

  /**
   * 在拆分列表项时保持标记。
   * @default false
   * @example true
   */
  keepMarks: boolean,

  /**
   * 在拆分列表项时保持属性。
   * @default false
   * @example true
   */
  keepAttributes: boolean,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    orderedList: {
      /**
       * 切换一个有序列表
       * @example editor.commands.toggleOrderedList()
       */
      toggleOrderedList: () => ReturnType,
    }
  }
}

/**
 * 匹配有序列表到 1. 在输入（或任何数字后跟一个点）。
 */
export const inputRegex = /^(\d+)\.\s$/

/**
 * 此扩展允许您创建有序列表。
 * 这需要 ListItem 扩展。
 * @see https://www.tiptap.dev/api/nodes/ordered-list
 * @see https://www.tiptap.dev/api/nodes/list-item
 */
export const OrderedList = Node.create<OrderedListOptions>({
  name: 'orderedList',

  addOptions() {
    return {
      itemTypeName: 'listItem',
      HTMLAttributes: {},
      keepMarks: false,
      keepAttributes: false,
    }
  },

  group: 'block list',

  content() {
    return `${this.options.itemTypeName}+`
  },

  addAttributes() {
    return {
      start: {
        default: 1,
        parseHTML: element => {
          return element.hasAttribute('start')
            ? parseInt(element.getAttribute('start') || '', 10)
            : 1
        },
      },
      type: {
        default: null,
        parseHTML: element => element.getAttribute('type'),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'ol',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { start, ...attributesWithoutStart } = HTMLAttributes

    return start === 1
      ? ['ol', mergeAttributes(this.options.HTMLAttributes, attributesWithoutStart), 0]
      : ['ol', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      toggleOrderedList: () => ({ commands, chain }) => {
        if (this.options.keepAttributes) {
          return chain().toggleList(this.name, this.options.itemTypeName, this.options.keepMarks).updateAttributes(ListItemName, this.editor.getAttributes(TextStyleName)).run()
        }
        return commands.toggleList(this.name, this.options.itemTypeName, this.options.keepMarks)
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-7': () => this.editor.commands.toggleOrderedList(),
    }
  },

  addInputRules() {
    let inputRule = wrappingInputRule({
      find: inputRegex,
      type: this.type,
      getAttributes: match => ({ start: +match[1] }),
      joinPredicate: (match, node) => node.childCount + node.attrs.start === +match[1],
    })

    if (this.options.keepMarks || this.options.keepAttributes) {
      inputRule = wrappingInputRule({
        find: inputRegex,
        type: this.type,
        keepMarks: this.options.keepMarks,
        keepAttributes: this.options.keepAttributes,
        getAttributes: match => ({ start: +match[1], ...this.editor.getAttributes(TextStyleName) }),
        joinPredicate: (match, node) => node.childCount + node.attrs.start === +match[1],
        editor: this.editor,
      })
    }
    return [
      inputRule,
    ]
  },
})
