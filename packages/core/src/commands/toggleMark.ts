import { MarkType } from '@tiptap/pm/model'

import { getMarkType } from '../helpers/getMarkType.js'
import { isMarkActive } from '../helpers/isMarkActive.js'
import { RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    toggleMark: {
      /**
       * 切换一个标记的开和关。
       * @param typeOrName 标记的类型或名称。
       * @param attributes 标记的属性。
       * @param options.extendEmptyMarkRange 在当前选择范围内删除标记。默认值为 `false`。
       * @example editor.commands.toggleMark('bold')
       */
      toggleMark: (
        /**
         * 标记的类型或名称。
         */
        typeOrName: string | MarkType,

        /**
         * 标记的属性。
         */
        attributes?: Record<string, any>,

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

export const toggleMark: RawCommands['toggleMark'] = (typeOrName, attributes = {}, options = {}) => ({ state, commands }) => {
  const { extendEmptyMarkRange = false } = options
  const type = getMarkType(typeOrName, state.schema)
  const isActive = isMarkActive(state, type, attributes)

  if (isActive) {
    return commands.unsetMark(type, { extendEmptyMarkRange })
  }

  return commands.setMark(type, attributes)
}
