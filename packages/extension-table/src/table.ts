import {
  callOrReturn, getExtensionField, mergeAttributes, Node, ParentConfig,
} from '@tiptap/core'
import { DOMOutputSpec, Node as ProseMirrorNode } from '@tiptap/pm/model'
import { TextSelection } from '@tiptap/pm/state'
import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  CellSelection,
  columnResizing,
  deleteColumn,
  deleteRow,
  deleteTable,
  fixTables,
  goToNextCell,
  mergeCells,
  setCellAttr,
  splitCell,
  tableEditing,
  toggleHeader,
  toggleHeaderCell,
} from '@tiptap/pm/tables'
import { EditorView, NodeView } from '@tiptap/pm/view'

import { TableView } from './TableView.js'
import { createColGroup } from './utilities/createColGroup.js'
import { createTable } from './utilities/createTable.js'
import { deleteTableWhenAllCellsSelected } from './utilities/deleteTableWhenAllCellsSelected.js'

export interface TableOptions {
  /**
   * 表元素的 HTML 属性。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>

  /**
   * 启用表格调整大小。
   * @default false
   * @example true
   */
  resizable: boolean

  /**
   * 调整大小的句柄宽度。
   * @default 5
   * @example 10
   */
  handleWidth: number

  /**
   * 单元格的最小宽度。
   * @default 25
   * @example 50
   */
  cellMinWidth: number

  /**
   * 渲染表格的节点视图。
   * @default TableView
   */
  View: (new (node: ProseMirrorNode, cellMinWidth: number, view: EditorView) => NodeView) | null

  /**
   * 启用最后一列的调整大小。
   * @default true
   * @example false
   */
  lastColumnResizable: boolean

  /**
   * 允许表节点选择。
   * @default false
   * @example true
   */
  allowTableNodeSelection: boolean
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    table: {
      /**
       * 插入一个表格
       * @param options 表格属性
       * @returns 如果命令成功，则为 true，否则为 false
       * @example editor.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
       */
      insertTable: (options?: {
        rows?: number
        cols?: number
        withHeaderRow?: boolean
      }) => ReturnType

      /**
       * 在当前列之前添加一列
       * @returns 如果命令成功，则为 true，否则为 false
       * @example editor.commands.addColumnBefore()
       */
      addColumnBefore: () => ReturnType

      /**
       * 在当前列之后添加一列
       * @returns 如果命令成功，则为 true，否则为 false
       * @example editor.commands.addColumnAfter()
       */
      addColumnAfter: () => ReturnType

      /**
       * 删除当前列
       * @returns 如果命令成功，则为 true，否则为 false
       * @example editor.commands.deleteColumn()
       */
      deleteColumn: () => ReturnType

      /**
       * 在当前行之前添加一行
       * @returns 如果命令成功，则为 true，否则为 false
       * @example editor.commands.addRowBefore()
       */
      addRowBefore: () => ReturnType

      /**
       * 在当前行之后添加一行
       * @returns 如果命令成功，则为 true，否则为 false
       * @example editor.commands.addRowAfter()
       */
      addRowAfter: () => ReturnType

      /**
       * 删除当前行
       * @returns 如果命令成功，则为 true，否则为 false
       * @example editor.commands.deleteRow()
       */
      deleteRow: () => ReturnType

      /**
       * 删除当前表格
       * @returns 如果命令成功，则为 true，否则为 false
       * @example editor.commands.deleteTable()
       */
      deleteTable: () => ReturnType

      /**
       * 合并当前选中的单元格
       * @returns 如果命令成功，则为 true，否则为 false
       * @example editor.commands.mergeCells()
       */
      mergeCells: () => ReturnType

      /**
       * 拆分当前选中的单元格
       * @returns 如果命令成功，则为 true，否则为 false
       * @example editor.commands.splitCell()
       */
      splitCell: () => ReturnType

      /**
       * 切换头列
       * @returns 如果命令成功，则为 true，否则为 false
       * @example editor.commands.toggleHeaderColumn()
       */
      toggleHeaderColumn: () => ReturnType

      /**
       * 切换头行
       * @returns 如果命令成功，则为 true，否则为 false
       * @example editor.commands.toggleHeaderRow()
       */
      toggleHeaderRow: () => ReturnType

      /**
       * 切换头单元格
       * @returns 如果命令成功，则为 true，否则为 false
       * @example editor.commands.toggleHeaderCell()
       */
      toggleHeaderCell: () => ReturnType

      /**
       * 合并或拆分当前选中的单元格
       * @returns 如果命令成功，则为 true，否则为 false
       * @example editor.commands.mergeOrSplit()
       */
      mergeOrSplit: () => ReturnType

      /**
       * 设置单元格属性
       * @param name 属性名称
       * @param value 属性值
       * @returns 如果命令成功，则为 true，否则为 false
       * @example editor.commands.setCellAttribute('align', 'right')
       */
      setCellAttribute: (name: string, value: any) => ReturnType

      /**
       * 移动到下一个单元格
       * @returns 如果命令成功，则为 true，否则为 false
       * @example editor.commands.goToNextCell()
       */
      goToNextCell: () => ReturnType

      /**
       * 移动到上一个单元格
       * @returns 如果命令成功，则为 true，否则为 false
       * @example editor.commands.goToPreviousCell()
       */
      goToPreviousCell: () => ReturnType

      /**
       * 尝试修复表格结构（如果需要）
       * @returns 如果命令成功，则为 true，否则为 false
       * @example editor.commands.fixTables()
       */
      fixTables: () => ReturnType

      /**
       * 在当前表格中设置单元格选择
       * @param position 单元格位置
       * @returns 如果命令成功，则为 true，否则为 false
       * @example editor.commands.setCellSelection({ anchorCell: 1, headCell: 2 })
       */
      setCellSelection: (position: { anchorCell: number; headCell?: number }) => ReturnType
    }
  }

  interface NodeConfig<Options, Storage> {
    /**
     * 一个字符串或函数来确定表格的角色。
     * @default 'table'
     * @example () => 'table'
     */
    tableRole?:
      | string
      | ((this: {
      name: string
      options: Options
      storage: Storage
      parent: ParentConfig<NodeConfig<Options>>['tableRole']
    }) => string)
  }
}

/**
 * 此扩展允许您创建表格。
 * @see https://www.tiptap.dev/api/nodes/table
 */
export const Table = Node.create<TableOptions>({
  name: 'table',

  // @ts-ignore
  addOptions() {
    return {
      HTMLAttributes: {},
      resizable: false,
      handleWidth: 5,
      cellMinWidth: 25,
      // TODO: fix
      View: TableView,
      lastColumnResizable: true,
      allowTableNodeSelection: false,
    }
  },

  content: 'tableRow+',

  tableRole: 'table',

  isolating: true,

  group: 'block',

  parseHTML() {
    return [{ tag: 'table' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    const { colgroup, tableWidth, tableMinWidth } = createColGroup(
      node,
      this.options.cellMinWidth,
    )

    const table: DOMOutputSpec = [
      'table',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        style: tableWidth
          ? `width: ${tableWidth}`
          : `min-width: ${tableMinWidth}`,
      }),
      colgroup,
      ['tbody', 0],
    ]

    return table
  },

  addCommands() {
    return {
      insertTable:
        ({ rows = 3, cols = 3, withHeaderRow = true } = {}) => ({ tr, dispatch, editor }) => {
          const node = createTable(editor.schema, rows, cols, withHeaderRow)

          if (dispatch) {
            const offset = tr.selection.from + 1

            tr.replaceSelectionWith(node)
              .scrollIntoView()
              .setSelection(TextSelection.near(tr.doc.resolve(offset)))
          }

          return true
        },
      addColumnBefore:
        () => ({ state, dispatch }) => {
          return addColumnBefore(state, dispatch)
        },
      addColumnAfter:
        () => ({ state, dispatch }) => {
          return addColumnAfter(state, dispatch)
        },
      deleteColumn:
        () => ({ state, dispatch }) => {
          return deleteColumn(state, dispatch)
        },
      addRowBefore:
        () => ({ state, dispatch }) => {
          return addRowBefore(state, dispatch)
        },
      addRowAfter:
        () => ({ state, dispatch }) => {
          return addRowAfter(state, dispatch)
        },
      deleteRow:
        () => ({ state, dispatch }) => {
          return deleteRow(state, dispatch)
        },
      deleteTable:
        () => ({ state, dispatch }) => {
          return deleteTable(state, dispatch)
        },
      mergeCells:
        () => ({ state, dispatch }) => {
          return mergeCells(state, dispatch)
        },
      splitCell:
        () => ({ state, dispatch }) => {
          return splitCell(state, dispatch)
        },
      toggleHeaderColumn:
        () => ({ state, dispatch }) => {
          return toggleHeader('column')(state, dispatch)
        },
      toggleHeaderRow:
        () => ({ state, dispatch }) => {
          return toggleHeader('row')(state, dispatch)
        },
      toggleHeaderCell:
        () => ({ state, dispatch }) => {
          return toggleHeaderCell(state, dispatch)
        },
      mergeOrSplit:
        () => ({ state, dispatch }) => {
          if (mergeCells(state, dispatch)) {
            return true
          }

          return splitCell(state, dispatch)
        },
      setCellAttribute:
        (name, value) => ({ state, dispatch }) => {
          return setCellAttr(name, value)(state, dispatch)
        },
      goToNextCell:
        () => ({ state, dispatch }) => {
          return goToNextCell(1)(state, dispatch)
        },
      goToPreviousCell:
        () => ({ state, dispatch }) => {
          return goToNextCell(-1)(state, dispatch)
        },
      fixTables:
        () => ({ state, dispatch }) => {
          if (dispatch) {
            fixTables(state)
          }

          return true
        },
      setCellSelection:
        position => ({ tr, dispatch }) => {
          if (dispatch) {
            const selection = CellSelection.create(tr.doc, position.anchorCell, position.headCell)

            // @ts-ignore
            tr.setSelection(selection)
          }

          return true
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (this.editor.commands.goToNextCell()) {
          return true
        }

        if (!this.editor.can().addRowAfter()) {
          return false
        }

        return this.editor.chain().addRowAfter().goToNextCell().run()
      },
      'Shift-Tab': () => this.editor.commands.goToPreviousCell(),
      Backspace: deleteTableWhenAllCellsSelected,
      'Mod-Backspace': deleteTableWhenAllCellsSelected,
      Delete: deleteTableWhenAllCellsSelected,
      'Mod-Delete': deleteTableWhenAllCellsSelected,
    }
  },

  addProseMirrorPlugins() {
    const isResizable = this.options.resizable && this.editor.isEditable

    return [
      ...(isResizable
        ? [
          columnResizing({
            handleWidth: this.options.handleWidth,
            cellMinWidth: this.options.cellMinWidth,
            defaultCellMinWidth: this.options.cellMinWidth,
            View: this.options.View,
            lastColumnResizable: this.options.lastColumnResizable,
          }),
        ]
        : []),
      tableEditing({
        allowTableNodeSelection: this.options.allowTableNodeSelection,
      }),
    ]
  },

  extendNodeSchema(extension) {
    const context = {
      name: extension.name,
      options: extension.options,
      storage: extension.storage,
    }

    return {
      tableRole: callOrReturn(getExtensionField(extension, 'tableRole', context)),
    }
  },
})
