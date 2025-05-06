import { Command, CommandProps, RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    first: {
      /**
       * 依次运行一个命令，并在第一个返回 true 的命令停止。
       * @param commands 要运行的命令。
       * @example editor.commands.first([command1, command2])
       */
      first: (commands: Command[] | ((props: CommandProps) => Command[])) => ReturnType,
    }
  }
}

export const first: RawCommands['first'] = commands => props => {
  const items = typeof commands === 'function'
    ? commands(props)
    : commands

  for (let i = 0; i < items.length; i += 1) {
    if (items[i](props)) {
      return true
    }
  }

  return false
}
