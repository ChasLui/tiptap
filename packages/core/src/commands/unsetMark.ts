import { MarkType } from '@tiptap/pm/model'

import { getMarkRange } from '../helpers/getMarkRange.js'
import { getMarkType } from '../helpers/getMarkType.js'
import { RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    unsetMark: {
      /**
       * 删除当前选择中的所有标记。
       * @param typeOrName 标记的类型或名称。
       * @param options.extendEmptyMarkRange 在当前选择范围内删除标记。默认值为 `false`。
       * @example editor.commands.unsetMark('bold')
       */
      unsetMark: (
        /**
         * 标记的类型或名称。
         */
        typeOrName: string | MarkType,

        options?: {
          /**
           * 在当前选择范围内删除标记。默认值为 `false`。
           */
          extendEmptyMarkRange?: boolean
        },
      ) => ReturnType
    }
  }
}

export const unsetMark: RawCommands['unsetMark'] = (typeOrName, options = {}) => ({ tr, state, dispatch }) => {
  const { extendEmptyMarkRange = false } = options
  const { selection } = tr
  const type = getMarkType(typeOrName, state.schema)
  const { $from, empty, ranges } = selection

  if (!dispatch) {
    return true
  }

  if (empty && extendEmptyMarkRange) {
    let { from, to } = selection
    const attrs = $from.marks().find(mark => mark.type === type)?.attrs
    const range = getMarkRange($from, type, attrs)

    if (range) {
      from = range.from
      to = range.to
    }

    tr.removeMark(from, to, type)
  } else {
    ranges.forEach(range => {
      tr.removeMark(range.$from.pos, range.$to.pos, type)
    })
  }

  tr.removeStoredMark(type)

  return true
}
