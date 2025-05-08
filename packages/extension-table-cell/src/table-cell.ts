import { mergeAttributes, Node } from '@tiptap/core'

export interface TableCellOptions {
  /**
   * 表单元格节点的 HTML 属性。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>,
}

/**
 * 此扩展允许您创建表单元格。
 * @see https://www.tiptap.dev/api/nodes/table-cell
 */
export const TableCell = Node.create<TableCellOptions>({
  name: 'tableCell',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  content: 'block+',

  addAttributes() {
    return {
      colspan: {
        default: 1,
      },
      rowspan: {
        default: 1,
      },
      colwidth: {
        default: null,
        parseHTML: element => {
          const colwidth = element.getAttribute('colwidth')
          const value = colwidth
            ? colwidth.split(',').map(width => parseInt(width, 10))
            : null

          return value
        },
      },
    }
  },

  tableRole: 'cell',

  isolating: true,

  parseHTML() {
    return [
      { tag: 'td' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['td', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

})
