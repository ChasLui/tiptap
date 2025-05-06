// @ts-ignore
// TODO: add types to @types/prosemirror-commands
import { selectTextblockEnd as originalSelectTextblockEnd } from '@tiptap/pm/commands'

import { RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    selectTextblockEnd: {
      /**
       * 将光标移动到当前文本块的末尾。
       * @example editor.commands.selectTextblockEnd()
       */
      selectTextblockEnd: () => ReturnType
    }
  }
}

export const selectTextblockEnd: RawCommands['selectTextblockEnd'] = () => ({ state, dispatch }) => {
  return originalSelectTextblockEnd(state, dispatch)
}
