import { mergeAttributes, Node } from '@tiptap/core'

export interface TableHeaderOptions {
  /**
   * 表头节点的 HTML 属性。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>,
}

/**
 * 此扩展允许您创建表头。
 * @see https://www.tiptap.dev/api/nodes/table-header
 */
export const TableHeader = Node.create<TableHeaderOptions>({
  name: 'tableHeader',

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

  tableRole: 'header_cell',

  isolating: true,

  parseHTML() {
    return [
      { tag: 'th' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['th', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

})
