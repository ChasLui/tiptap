import { MarkType } from '@tiptap/pm/model'
import { TextSelection } from '@tiptap/pm/state'

import { getMarkRange } from '../helpers/getMarkRange.js'
import { getMarkType } from '../helpers/getMarkType.js'
import { RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    extendMarkRange: {
      /**
       * 通过类型或名称扩展文本选择到当前标记。
       * @param typeOrName 标记的类型或名称。
       * @param attributes 标记的属性。
       * @example editor.commands.extendMarkRange('bold')
       * @example editor.commands.extendMarkRange('mention', { userId: "1" })
       */
      extendMarkRange: (
        /**
         * 标记的类型或名称。
         */
        typeOrName: string | MarkType,

        /**
         * 标记的属性。
         */
        attributes?: Record<string, any>,
      ) => ReturnType
    }
  }
}

export const extendMarkRange: RawCommands['extendMarkRange'] = (typeOrName, attributes = {}) => ({ tr, state, dispatch }) => {
  const type = getMarkType(typeOrName, state.schema)
  const { doc, selection } = tr
  const { $from, from, to } = selection

  if (dispatch) {
    const range = getMarkRange($from, type, attributes)

    if (range && range.from <= from && range.to >= to) {
      const newSelection = TextSelection.create(doc, range.from, range.to)

      tr.setSelection(newSelection)
    }
  }

  return true
}
