import { Mark, mergeAttributes } from '@tiptap/core'
import type { StyleParseRule } from '@tiptap/pm/model'

export interface SubscriptExtensionOptions {
  /**
   * HTML 属性添加到下标元素。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    subscript: {
      /**
       * 设置一个下标标记
       * @example editor.commands.setSubscript()
       */
      setSubscript: () => ReturnType,
      /**
       * 切换一个下标标记
       * @example editor.commands.toggleSubscript()
       */
      toggleSubscript: () => ReturnType,
      /**
       * 取消一个下标标记
       * @example editor.commands.unsetSubscript()
       */
      unsetSubscript: () => ReturnType,
    }
  }
}

/**
 * 此扩展允许您创建下标文本。
 * @see https://www.tiptap.dev/api/marks/subscript
 */
export const Subscript = Mark.create<SubscriptExtensionOptions>({
  name: 'subscript',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  parseHTML() {
    return [
      {
        tag: 'sub',
      },
      {
        style: 'vertical-align',
        getAttrs(value) {
          // 如果垂直对齐不是 sub，则不匹配此规则。
          if (value !== 'sub') {
            return false
          }

          // 如果它通过了，我们将匹配，并且这个标记将被应用。
          return null
        },
      } as StyleParseRule,
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['sub', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setSubscript: () => ({ commands }) => {
        return commands.setMark(this.name)
      },
      toggleSubscript: () => ({ commands }) => {
        return commands.toggleMark(this.name)
      },
      unsetSubscript: () => ({ commands }) => {
        return commands.unsetMark(this.name)
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-,': () => this.editor.commands.toggleSubscript(),
    }
  },
})
