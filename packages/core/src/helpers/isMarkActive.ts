import { MarkType } from '@tiptap/pm/model'
import { EditorState } from '@tiptap/pm/state'

import { MarkRange } from '../types.js'
import { objectIncludes } from '../utilities/objectIncludes.js'
import { getMarkType } from './getMarkType.js'

export function isMarkActive(
  state: EditorState,
  typeOrName: MarkType | string | null,
  attributes: Record<string, any> = {},
): boolean {
  const { empty, ranges } = state.selection
  const type = typeOrName ? getMarkType(typeOrName, state.schema) : null

  if (empty) {
    return !!(state.storedMarks || state.selection.$from.marks())
      .filter(mark => {
        if (!type) {
          return true
        }

        return type.name === mark.type.name
      })
      .find(mark => objectIncludes(mark.attrs, attributes, { strict: false }))
  }

  let selectionRange = 0
  const markRanges: MarkRange[] = []

  ranges.forEach(({ $from, $to }) => {
    const from = $from.pos
    const to = $to.pos

    state.doc.nodesBetween(from, to, (node, pos) => {
      if (!node.isText && !node.marks.length) {
        return
      }

      const relativeFrom = Math.max(from, pos)
      const relativeTo = Math.min(to, pos + node.nodeSize)
      const range = relativeTo - relativeFrom

      selectionRange += range

      markRanges.push(
        ...node.marks.map(mark => ({
          mark,
          from: relativeFrom,
          to: relativeTo,
        })),
      )
    })
  })

  if (selectionRange === 0) {
    return false
  }

  // 计算匹配标记的范围
  const matchedRange = markRanges
    .filter(markRange => {
      if (!type) {
        return true
      }

      return type.name === markRange.mark.type.name
    })
    .filter(markRange => objectIncludes(markRange.mark.attrs, attributes, { strict: false }))
    .reduce((sum, markRange) => sum + markRange.to - markRange.from, 0)

  // 计算排除搜索标记的范围，例如 `code` 不允许任何其他标记
  const excludedRange = markRanges
    .filter(markRange => {
      if (!type) {
        return true
      }

      return markRange.mark.type !== type && markRange.mark.type.excludes(type)
    })
    .reduce((sum, markRange) => sum + markRange.to - markRange.from, 0)

  // 只有当有匹配时才包含 `excludedRange` 的结果
  const range = matchedRange > 0 ? matchedRange + excludedRange : matchedRange

  return range >= selectionRange
}
