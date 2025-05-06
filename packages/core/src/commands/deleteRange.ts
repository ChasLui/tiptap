import { Range, RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    deleteRange: {
      /**
       * 删除给定的范围。
       * @param range 要删除的范围。
       * @example editor.commands.deleteRange({ from: 1, to: 3 })
       */
      deleteRange: (range: Range) => ReturnType,
    }
  }
}

export const deleteRange: RawCommands['deleteRange'] = range => ({ tr, dispatch }) => {
  const { from, to } = range

  if (dispatch) {
    tr.delete(from, to)
  }

  return true
}
