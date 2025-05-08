import {
  Mark,
  markInputRule,
  markPasteRule,
  mergeAttributes,
} from '@tiptap/core'

export interface HighlightOptions {
  /**
   * 允许多个突出显示颜色
   * @default false
   * @example true
   */
  multicolor: boolean,

  /**
   * 要添加到突出显示元素的 HTML 属性。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    highlight: {
      /**
       * 设置一个突出显示标记
       * @param attributes 突出显示属性
       * @example editor.commands.setHighlight({ color: 'red' })
       */
      setHighlight: (attributes?: { color: string }) => ReturnType,
      /**
       * 切换一个突出显示标记
       * @param attributes 突出显示属性
       * @example editor.commands.toggleHighlight({ color: 'red' })
       */
      toggleHighlight: (attributes?: { color: string }) => ReturnType,
      /**
       * 取消设置一个突出显示标记
       * @example editor.commands.unsetHighlight()
       */
      unsetHighlight: () => ReturnType,
    }
  }
}

/**
 * 匹配一个突出显示到 ==highlight== 在输入。
 */
export const inputRegex = /(?:^|\s)(==(?!\s+==)((?:[^=]+))==(?!\s+==))$/

/**
 * 匹配一个突出显示到 ==highlight== 在粘贴。
 */
export const pasteRegex = /(?:^|\s)(==(?!\s+==)((?:[^=]+))==(?!\s+==))/g

/**
 * 此扩展允许您突出显示文本。
 * @see https://www.tiptap.dev/api/marks/highlight
 */
export const Highlight = Mark.create<HighlightOptions>({
  name: 'highlight',

  addOptions() {
    return {
      multicolor: false,
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    if (!this.options.multicolor) {
      return {}
    }

    return {
      color: {
        default: null,
        parseHTML: element => element.getAttribute('data-color') || element.style.backgroundColor,
        renderHTML: attributes => {
          if (!attributes.color) {
            return {}
          }

          return {
            'data-color': attributes.color,
            style: `background-color: ${attributes.color}; color: inherit`,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'mark',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['mark', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setHighlight: attributes => ({ commands }) => {
        return commands.setMark(this.name, attributes)
      },
      toggleHighlight: attributes => ({ commands }) => {
        return commands.toggleMark(this.name, attributes)
      },
      unsetHighlight: () => ({ commands }) => {
        return commands.unsetMark(this.name)
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-h': () => this.editor.commands.toggleHighlight(),
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
