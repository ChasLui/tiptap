import { joinTextblockBackward as originalCommand } from '@tiptap/pm/commands'

import { RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    joinTextblockBackward: {
      /**
       * 一种更有限的 joinBackward 形式，仅在光标处于文本块的开头时尝试将当前文本块加入到之前的文本块中。
       */
      joinTextblockBackward: () => ReturnType
    }
  }
}

export const joinTextblockBackward: RawCommands['joinTextblockBackward'] = () => ({ state, dispatch }) => {
  return originalCommand(state, dispatch)
}
