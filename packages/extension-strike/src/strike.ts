import {
  Mark,
  markInputRule,
  markPasteRule,
  mergeAttributes,
} from '@tiptap/core'

export interface StrikeOptions {
  /**
   * HTML 属性添加到删除线元素。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    strike: {
      /**
       * 设置一个删除线标记
       * @example editor.commands.setStrike()
       */
      setStrike: () => ReturnType,
      /**
       * 切换一个删除线标记
       * @example editor.commands.toggleStrike()
       */
      toggleStrike: () => ReturnType,
      /**
       * 取消一个删除线标记
       * @example editor.commands.unsetStrike()
       */
      unsetStrike: () => ReturnType,
    }
  }
}

/**
 * 匹配一个删除线到 ~~strike~~ 在输入。
 */
export const inputRegex = /(?:^|\s)(~~(?!\s+~~)((?:[^~]+))~~(?!\s+~~))$/

/**
 * 匹配一个删除线到 ~~strike~~ 在粘贴。
 */
export const pasteRegex = /(?:^|\s)(~~(?!\s+~~)((?:[^~]+))~~(?!\s+~~))/g

/**
 * 此扩展允许您创建删除线文本。
 * @see https://www.tiptap.dev/api/marks/strike
 */
export const Strike = Mark.create<StrikeOptions>({
  name: 'strike',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  parseHTML() {
    return [
      {
        tag: 's',
      },
      {
        tag: 'del',
      },
      {
        tag: 'strike',
      },
      {
        style: 'text-decoration',
        consuming: false,
        getAttrs: style => ((style as string).includes('line-through') ? {} : false),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['s', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setStrike: () => ({ commands }) => {
        return commands.setMark(this.name)
      },
      toggleStrike: () => ({ commands }) => {
        return commands.toggleMark(this.name)
      },
      unsetStrike: () => ({ commands }) => {
        return commands.unsetMark(this.name)
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-s': () => this.editor.commands.toggleStrike(),
    }
  },

  addInputRules() {
    return [
      markInputRule({
        find: inputRegex,
        type: this.type,
      }),
    ]
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: pasteRegex,
        type: this.type,
      }),
    ]
  },
})
