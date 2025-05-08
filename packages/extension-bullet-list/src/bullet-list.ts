import { mergeAttributes, Node, wrappingInputRule } from '@tiptap/core'

const ListItemName = 'listItem'
const TextStyleName = 'textStyle'

export interface BulletListOptions {
  /**
   * 列表项的节点名称
   * @default 'listItem'
   * @example 'paragraph'
   */
  itemTypeName: string,

  /**
   * 添加到列表项元素的 HTML 属性
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>,

  /**
   * 在拆分列表时保持标记
   * @default false
   * @example true
   */
  keepMarks: boolean,

  /**
   * 在拆分列表时保持属性
   * @default false
   * @example true
   */
  keepAttributes: boolean,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    bulletList: {
      /**
       * 切换一个列表
       */
      toggleBulletList: () => ReturnType,
    }
  }
}

/**
 * 匹配一个列表到破折号或星号。
 */
export const inputRegex = /^\s*([-+*])\s$/

/**
 * 此扩展允许您创建列表。
 * 这需要 ListItem 扩展。
 * @see https://tiptap.dev/api/nodes/bullet-list
 * @see https://tiptap.dev/api/nodes/list-item.
 */
export const BulletList = Node.create<BulletListOptions>({
  name: 'bulletList',

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

  parseHTML() {
    return [
      { tag: 'ul' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['ul', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      toggleBulletList: () => ({ commands, chain }) => {
        if (this.options.keepAttributes) {
          return chain().toggleList(this.name, this.options.itemTypeName, this.options.keepMarks).updateAttributes(ListItemName, this.editor.getAttributes(TextStyleName)).run()
        }
        return commands.toggleList(this.name, this.options.itemTypeName, this.options.keepMarks)
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-8': () => this.editor.commands.toggleBulletList(),
    }
  },

  addInputRules() {
    let inputRule = wrappingInputRule({
      find: inputRegex,
      type: this.type,
    })

    if (this.options.keepMarks || this.options.keepAttributes) {
      inputRule = wrappingInputRule({
        find: inputRegex,
        type: this.type,
        keepMarks: this.options.keepMarks,
        keepAttributes: this.options.keepAttributes,
        getAttributes: () => { return this.editor.getAttributes(TextStyleName) },
        editor: this.editor,
      })
    }
    return [
      inputRule,
    ]
  },
})
