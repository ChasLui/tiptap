import { mergeAttributes, Node } from '@tiptap/core'

export interface HardBreakOptions {
  /**
   * 控制是否在硬断行后保留标记。
   * @default true
   * @example false
   */
  keepMarks: boolean,

  /**
   * 要添加到硬断行元素的 HTML 属性。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    hardBreak: {
      /**
       * 添加一个硬断行
       * @example editor.commands.setHardBreak()
       */
      setHardBreak: () => ReturnType,
    }
  }
}

/**
 * 此扩展允许您插入硬断行。
 * @see https://www.tiptap.dev/api/nodes/hard-break
 */
export const HardBreak = Node.create<HardBreakOptions>({
  name: 'hardBreak',

  addOptions() {
    return {
      keepMarks: true,
      HTMLAttributes: {},
    }
  },

  inline: true,

  group: 'inline',

  selectable: false,

  linebreakReplacement: true,

  parseHTML() {
    return [
      { tag: 'br' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['br', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  renderText() {
    return '\n'
  },

  addCommands() {
    return {
      setHardBreak: () => ({
        commands,
        chain,
        state,
        editor,
      }) => {
        return commands.first([
          () => commands.exitCode(),
          () => commands.command(() => {
            const { selection, storedMarks } = state

            if (selection.$from.parent.type.spec.isolating) {
              return false
            }

            const { keepMarks } = this.options
            const { splittableMarks } = editor.extensionManager
            const marks = storedMarks
              || (selection.$to.parentOffset && selection.$from.marks())

            return chain()
              .insertContent({ type: this.name })
              .command(({ tr, dispatch }) => {
                if (dispatch && marks && keepMarks) {
                  const filteredMarks = marks
                    .filter(mark => splittableMarks.includes(mark.type.name))

                  tr.ensureMarks(filteredMarks)
                }

                return true
              })
              .run()
          }),
        ])
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.setHardBreak(),
      'Shift-Enter': () => this.editor.commands.setHardBreak(),
    }
  },
})
