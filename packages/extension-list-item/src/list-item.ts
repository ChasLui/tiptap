import { mergeAttributes, Node } from '@tiptap/core'

export interface ListItemOptions {
  /**
   * 列表项节点的 HTML 属性。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>,

  /**
   * 无序列表节点的节点类型。
   * @default 'bulletList'
   * @example 'myCustomBulletList'
   */
  bulletListTypeName: string

  /**
   * 有序列表节点的节点类型。
   * @default 'orderedList'
   * @example 'myCustomOrderedList'
   */
  orderedListTypeName: string
}

/**
 * 此扩展允许您创建列表项。
 * @see https://www.tiptap.dev/api/nodes/list-item
 */
export const ListItem = Node.create<ListItemOptions>({
  name: 'listItem',

  addOptions() {
    return {
      HTMLAttributes: {},
      bulletListTypeName: 'bulletList',
      orderedListTypeName: 'orderedList',
    }
  },

  content: 'paragraph block*',

  defining: true,

  parseHTML() {
    return [
      {
        tag: 'li',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['li', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.splitListItem(this.name),
      Tab: () => this.editor.commands.sinkListItem(this.name),
      'Shift-Tab': () => this.editor.commands.liftListItem(this.name),
    }
  },
})
