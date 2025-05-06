import { Command, RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    command: {
      /**
       * 内联定义一个命令。
       * @param fn 命令函数。
       * @example
       * editor.commands.command(({ tr, state }) => {
       *   ...
       *   return true
       * })
       */
      command: (fn: (props: Parameters<Command>[0]) => boolean) => ReturnType,
    }
  }
}

export const command: RawCommands['command'] = fn => props => {
  return fn(props)
}
