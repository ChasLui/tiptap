import { MarkType, ResolvedPos } from '@tiptap/pm/model'
import { EditorState, Transaction } from '@tiptap/pm/state'

import { getMarkAttributes } from '../helpers/getMarkAttributes.js'
import { getMarkType } from '../helpers/getMarkType.js'
import { isTextSelection } from '../helpers/index.js'
import { RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    setMark: {
      /**
       * 添加一个带有新属性的标记。
       * @param typeOrName 标记的类型或名称。
       * @example editor.commands.setMark('bold', { level: 1 })
       */
      setMark: (typeOrName: string | MarkType, attributes?: Record<string, any>) => ReturnType
    }
  }
}

function canSetMark(state: EditorState, tr: Transaction, newMarkType: MarkType) {
  const { selection } = tr
  let cursor: ResolvedPos | null = null

  if (isTextSelection(selection)) {
    cursor = selection.$cursor
  }

  if (cursor) {
    const currentMarks = state.storedMarks ?? cursor.marks()

    // 可能没有当前的标记可以排除新的标记
    return (
      !!newMarkType.isInSet(currentMarks)
      || !currentMarks.some(mark => mark.type.excludes(newMarkType))
    )
  }

  const { ranges } = selection

  return ranges.some(({ $from, $to }) => {
    let someNodeSupportsMark = $from.depth === 0
      ? state.doc.inlineContent && state.doc.type.allowsMarkType(newMarkType)
      : false

    state.doc.nodesBetween($from.pos, $to.pos, (node, _pos, parent) => {
      // 如果我们已经找到一个可以启用的标记，返回 false 以绕过剩余的搜索
      if (someNodeSupportsMark) {
        return false
      }

      if (node.isInline) {
        const parentAllowsMarkType = !parent || parent.type.allowsMarkType(newMarkType)
        const currentMarksAllowMarkType = !!newMarkType.isInSet(node.marks)
          || !node.marks.some(otherMark => otherMark.type.excludes(newMarkType))

        someNodeSupportsMark = parentAllowsMarkType && currentMarksAllowMarkType
      }
      return !someNodeSupportsMark
    })

    return someNodeSupportsMark
  })
}
export const setMark: RawCommands['setMark'] = (typeOrName, attributes = {}) => ({ tr, state, dispatch }) => {
  const { selection } = tr
  const { empty, ranges } = selection
  const type = getMarkType(typeOrName, state.schema)

  if (dispatch) {
    if (empty) {
      const oldAttributes = getMarkAttributes(state, type)

      tr.addStoredMark(
        type.create({
          ...oldAttributes,
          ...attributes,
        }),
      )
    } else {
      ranges.forEach(range => {
        const from = range.$from.pos
        const to = range.$to.pos

        state.doc.nodesBetween(from, to, (node, pos) => {
          const trimmedFrom = Math.max(pos, from)
          const trimmedTo = Math.min(pos + node.nodeSize, to)
          const someHasMark = node.marks.find(mark => mark.type === type)

          // 如果已经有这种类型的标记
          // 我们知道我们必须合并它的属性
          // 否则我们添加一个新鲜的新的标记
          if (someHasMark) {
            node.marks.forEach(mark => {
              if (type === mark.type) {
                tr.addMark(
                  trimmedFrom,
                  trimmedTo,
                  type.create({
                    ...mark.attrs,
                    ...attributes,
                  }),
                )
              }
            })
          } else {
            tr.addMark(trimmedFrom, trimmedTo, type.create(attributes))
          }
        })
      })
    }
  }

  return canSetMark(state, tr, type)
}
