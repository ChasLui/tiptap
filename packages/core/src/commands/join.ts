import {
  joinBackward as originalJoinBackward,
  joinDown as originalJoinDown,
  joinForward as originalJoinForward,
  joinUp as originalJoinUp,
} from '@tiptap/pm/commands'

import { RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    joinUp: {
      /**
       * 将选中的块或选中的块的祖先块与上面的兄弟块合并。
       * @example editor.commands.joinUp()
       */
      joinUp: () => ReturnType
    }
    joinDown: {
      /**
       * 将选中的块或选中的块的祖先块与下面的兄弟块合并。
       * @example editor.commands.joinDown()
       */
      joinDown: () => ReturnType
    }
    joinBackward: {
      /**
       * 如果选择为空且在文本块的开头，则尝试减少该块与前一个块之间的距离—如果前面有一个可以直接合并的块，则合并它们。
       * 如果没有，则尝试通过将选中的块从其父块中提升出来或移动到前一个块的父块中，使选中的块更接近下一个块。
       * 如果给定，则使用视图进行准确的（双向感知）文本块开始检测。
       * @example editor.commands.joinBackward()
       */
      joinBackward: () => ReturnType
    }
    joinForward: {
      /**
       * 如果选择为空且光标在文本块的末尾，则尝试减少或删除该块与下一个块之间的边界—要么通过合并它们，要么通过在树结构中将另一个块更靠近这个块。
       * 如果给定，则使用视图进行准确的文本块开始检测。
       * @example editor.commands.joinForward()
       */
      joinForward: () => ReturnType
    }
  }
}

export const joinUp: RawCommands['joinUp'] = () => ({ state, dispatch }) => {
  return originalJoinUp(state, dispatch)
}

export const joinDown: RawCommands['joinDown'] = () => ({ state, dispatch }) => {
  return originalJoinDown(state, dispatch)
}

export const joinBackward: RawCommands['joinBackward'] = () => ({ state, dispatch }) => {
  return originalJoinBackward(state, dispatch)
}

export const joinForward: RawCommands['joinForward'] = () => ({ state, dispatch }) => {
  return originalJoinForward(state, dispatch)
}
