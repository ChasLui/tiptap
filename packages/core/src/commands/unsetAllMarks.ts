import { RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    unsetAllMarks: {
      /**
       * 删除当前选择中的所有标记。
       * @example editor.commands.unsetAllMarks()
       */
      unsetAllMarks: () => ReturnType,
    }
  }
}

export const unsetAllMarks: RawCommands['unsetAllMarks'] = () => ({ tr, dispatch }) => {
  const { selection } = tr
  const { empty, ranges } = selection

  if (empty) {
    return true
  }

  if (dispatch) {
    ranges.forEach(range => {
      tr.removeMark(range.$from.pos, range.$to.pos)
    })
  }

  return true
}
