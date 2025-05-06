import { joinTextblockForward as originalCommand } from '@tiptap/pm/commands'

import { RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    joinTextblockForward: {
      /**
       * 一种更有限的 joinForward 形式，仅在光标处于文本块的末尾时尝试将当前文本块加入到下一个文本块中。
       */
      joinTextblockForward: () => ReturnType
    }
  }
}

export const joinTextblockForward: RawCommands['joinTextblockForward'] = () => ({ state, dispatch }) => {
  return originalCommand(state, dispatch)
}
