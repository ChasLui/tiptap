import {
  Mark,
  markInputRule,
  markPasteRule,
  mergeAttributes,
} from '@tiptap/core'

export interface ItalicOptions {
  /**
   * 要添加到斜体元素的 HTML 属性。
   * @default {}
   * @example { class: 'foo' }
  */
  HTMLAttributes: Record<string, any>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    italic: {
      /**
       * 设置一个斜体标记
       * @example editor.commands.setItalic()
       */
      setItalic: () => ReturnType,
      /**
       * 切换一个斜体标记
       * @example editor.commands.toggleItalic()
       */
      toggleItalic: () => ReturnType,
      /**
       * 取消一个斜体标记
       * @example editor.commands.unsetItalic()
       */
      unsetItalic: () => ReturnType,
    }
  }
}

/**
 * 匹配一个斜体到 *italic* 在输入。
 */
export const starInputRegex = /(?:^|\s)(\*(?!\s+\*)((?:[^*]+))\*(?!\s+\*))$/

/**
 * 匹配一个斜体到 *italic* 在粘贴。
 */
export const starPasteRegex = /(?:^|\s)(\*(?!\s+\*)((?:[^*]+))\*(?!\s+\*))/g

/**
 * 匹配一个斜体到 _italic_ 在输入。
 */
export const underscoreInputRegex = /(?:^|\s)(_(?!\s+_)((?:[^_]+))_(?!\s+_))$/

/**
 * 匹配一个斜体到 _italic_ 在粘贴。
 */
export const underscorePasteRegex = /(?:^|\s)(_(?!\s+_)((?:[^_]+))_(?!\s+_))/g

/**
 * 此扩展允许您创建斜体文本。
 * @see https://www.tiptap.dev/api/marks/italic
 */
export const Italic = Mark.create<ItalicOptions>({
  name: 'italic',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  parseHTML() {
    return [
      {
        tag: 'em',
      },
      {
        tag: 'i',
        getAttrs: node => (node as HTMLElement).style.fontStyle !== 'normal' && null,
      },
      {
        style: 'font-style=normal',
        clearMark: mark => mark.type.name === this.name,
      },
      {
        style: 'font-style=italic',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['em', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setItalic: () => ({ commands }) => {
        return commands.setMark(this.name)
      },
      toggleItalic: () => ({ commands }) => {
        return commands.toggleMark(this.name)
      },
      unsetItalic: () => ({ commands }) => {
        return commands.unsetMark(this.name)
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-i': () => this.editor.commands.toggleItalic(),
      'Mod-I': () => this.editor.commands.toggleItalic(),
    }
  },

  addInputRules() {
    return [
      markInputRule({
        find: starInputRegex,
        type: this.type,
      }),
      markInputRule({
        find: underscoreInputRegex,
        type: this.type,
      }),
    ]
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: starPasteRegex,
        type: this.type,
      }),
      markPasteRule({
        find: underscorePasteRegex,
        type: this.type,
      }),
    ]
  },
})
