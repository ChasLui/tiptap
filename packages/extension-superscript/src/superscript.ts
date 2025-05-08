import { Mark, mergeAttributes } from '@tiptap/core'
import type { StyleParseRule } from '@tiptap/pm/model'

export interface SuperscriptExtensionOptions {
  /**
   * HTML 属性添加到上标元素。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    superscript: {
      /**
       * 设置一个上标标记
       * @example editor.commands.setSuperscript()
       */
      setSuperscript: () => ReturnType,
      /**
       * 切换一个上标标记
       * @example editor.commands.toggleSuperscript()
       */
      toggleSuperscript: () => ReturnType,
      /**
       * 取消一个上标标记
       * @example editor.commands.unsetSuperscript()
       */
      unsetSuperscript: () => ReturnType,
    }
  }
}

/**
 * 此扩展允许您创建上标文本。
 * @see https://www.tiptap.dev/api/marks/superscript
 */
export const Superscript = Mark.create<SuperscriptExtensionOptions>({
  name: 'superscript',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  parseHTML() {
    return [
      {
        tag: 'sup',
      },
      {
        style: 'vertical-align',
        getAttrs(value) {
          // 如果垂直对齐不是 super，则不匹配此规则。
          if (value !== 'super') {
            return false
          }

          // 如果它通过了，我们将匹配，并且这个标记将被应用。
          return null
        },
      } as StyleParseRule,
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['sup', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setSuperscript: () => ({ commands }) => {
        return commands.setMark(this.name)
      },
      toggleSuperscript: () => ({ commands }) => {
        return commands.toggleMark(this.name)
      },
      unsetSuperscript: () => ({ commands }) => {
        return commands.unsetMark(this.name)
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-.': () => this.editor.commands.toggleSuperscript(),
    }
  },
})
