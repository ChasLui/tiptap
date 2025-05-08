import {
  Mark,
  markInputRule,
  markPasteRule,
  mergeAttributes,
} from '@tiptap/core'

export interface CodeOptions {
  /**
   * 应用于代码元素的 HTML 属性。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    code: {
      /**
       * 设置一个代码标记
       */
      setCode: () => ReturnType,
      /**
       * 切换内联代码
       */
      toggleCode: () => ReturnType,
      /**
       * 取消设置一个代码标记
       */
      unsetCode: () => ReturnType,
    }
  }
}

/**
 * 匹配内联代码块的正则表达式，用反引号包围。
 * 它匹配：
 *     - 一个开头的反引号，后面跟着
 *     - 任何不包含反引号的文本（捕获用于标记），后面跟着
 *     - 一个闭合的反引号。
 * 这确保了任何在反引号之间的文本都被格式化为代码，
 * 无论周围的字符是什么（除了另一个反引号）。
 */
export const inputRegex = /(^|[^`])`([^`]+)`(?!`)/

/**
 * 匹配内联代码块，当粘贴时。
 */
export const pasteRegex = /(^|[^`])`([^`]+)`(?!`)/g

/**
 * 此扩展允许您将文本标记为内联代码。
 * @see https://tiptap.dev/api/marks/code
 */
export const Code = Mark.create<CodeOptions>({
  name: 'code',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  excludes: '_',

  code: true,

  exitable: true,

  parseHTML() {
    return [
      { tag: 'code' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['code', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setCode: () => ({ commands }) => {
        return commands.setMark(this.name)
      },
      toggleCode: () => ({ commands }) => {
        return commands.toggleMark(this.name)
      },
      unsetCode: () => ({ commands }) => {
        return commands.unsetMark(this.name)
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-e': () => this.editor.commands.toggleCode(),
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
