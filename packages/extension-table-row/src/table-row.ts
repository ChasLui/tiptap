import { mergeAttributes, Node } from '@tiptap/core'

export interface TableRowOptions {
  /**
   * 表行节点的 HTML 属性。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>,
}

/**
 * 此扩展允许您创建表行。
 * @see https://www.tiptap.dev/api/nodes/table-row
 */
export const TableRow = Node.create<TableRowOptions>({
  name: 'tableRow',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  content: '(tableCell | tableHeader)*',

  tableRole: 'row',

  parseHTML() {
    return [
      { tag: 'tr' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['tr', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },
})
