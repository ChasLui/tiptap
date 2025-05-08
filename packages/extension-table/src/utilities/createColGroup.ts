import { DOMOutputSpec, Node as ProseMirrorNode } from '@tiptap/pm/model'

import { getColStyleDeclaration } from './colStyle.js'

export type ColGroup = {
  colgroup: DOMOutputSpec
  tableWidth: string
  tableMinWidth: string
} | Record<string, never>;

/**
 * 为 ProseMirror 中的表格节点创建一个 colgroup 元素。
 *
 * @param node - 表示表格的 ProseMirror 节点。
 * @param cellMinWidth - 表格中单元格的最小宽度。
 * @param overrideCol - (可选) 要覆盖宽度的列的索引。
 * @param overrideValue - (可选) 要用于覆盖列的宽度值。
 * @returns 一个包含 colgroup 元素、表格的总宽度和表格的最小宽度的对象。
 */
export function createColGroup(
  node: ProseMirrorNode,
  cellMinWidth: number,
): ColGroup
export function createColGroup(
  node: ProseMirrorNode,
  cellMinWidth: number,
  overrideCol: number,
  overrideValue: number,
): ColGroup
export function createColGroup(
  node: ProseMirrorNode,
  cellMinWidth: number,
  overrideCol?: number,
  overrideValue?: number,
): ColGroup {
  let totalWidth = 0
  let fixedWidth = true
  const cols: DOMOutputSpec[] = []
  const row = node.firstChild

  if (!row) {
    return {}
  }

  for (let i = 0, col = 0; i < row.childCount; i += 1) {
    const { colspan, colwidth } = row.child(i).attrs

    for (let j = 0; j < colspan; j += 1, col += 1) {
      const hasWidth = overrideCol === col ? overrideValue : colwidth && colwidth[j] as number | undefined

      totalWidth += hasWidth || cellMinWidth

      if (!hasWidth) {
        fixedWidth = false
      }

      const [property, value] = getColStyleDeclaration(cellMinWidth, hasWidth)

      cols.push([
        'col',
        { style: `${property}: ${value}` },
      ])
    }
  }

  const tableWidth = fixedWidth ? `${totalWidth}px` : ''
  const tableMinWidth = fixedWidth ? '' : `${totalWidth}px`

  const colgroup: DOMOutputSpec = ['colgroup', {}, ...cols]

  return { colgroup, tableWidth, tableMinWidth }
}
