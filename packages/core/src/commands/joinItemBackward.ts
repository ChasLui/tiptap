import { joinPoint } from '@tiptap/pm/transform'

import { RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    joinItemBackward: {
      /**
       * 将两个项目向后合并。
       * @example editor.commands.joinItemBackward()
       */
      joinItemBackward: () => ReturnType
    }
  }
}

export const joinItemBackward: RawCommands['joinItemBackward'] = () => ({
  state,
  dispatch,
  tr,
}) => {
  try {
    const point = joinPoint(state.doc, state.selection.$from.pos, -1)

    if (point === null || point === undefined) {
      return false
    }

    tr.join(point, 2)

    if (dispatch) {
      dispatch(tr)
    }

    return true
  } catch {
    return false
  }
}
