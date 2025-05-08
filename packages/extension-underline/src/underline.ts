import { Mark, mergeAttributes } from '@tiptap/core'

export interface UnderlineOptions {
  /**
   * HTML属性要添加到下划线元素。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    underline: {
      /**
       * 设置下划线标记
       * @example editor.commands.setUnderline()
       */
      setUnderline: () => ReturnType,
      /**
       * 切换下划线标记
       * @example editor.commands.toggleUnderline()
       */
      toggleUnderline: () => ReturnType,
      /**
       * 取消下划线标记
       * @example editor.commands.unsetUnderline()
       */
      unsetUnderline: () => ReturnType,
    }
  }
}

/**
 * 此扩展允许您创建下划线文本。
 * @see https://www.tiptap.dev/api/marks/underline
 */
export const Underline = Mark.create<UnderlineOptions>({
  name: 'underline',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  parseHTML() {
    return [
      {
        tag: 'u',
      },
      {
        style: 'text-decoration',
        consuming: false,
        getAttrs: style => ((style as string).includes('underline') ? {} : false),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['u', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setUnderline: () => ({ commands }) => {
        return commands.setMark(this.name)
      },
      toggleUnderline: () => ({ commands }) => {
        return commands.toggleMark(this.name)
      },
      unsetUnderline: () => ({ commands }) => {
        return commands.unsetMark(this.name)
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-u': () => this.editor.commands.toggleUnderline(),
      'Mod-U': () => this.editor.commands.toggleUnderline(),
    }
  },
})
