import {
  Mark,
  markInputRule,
  markPasteRule,
  mergeAttributes,
} from '@tiptap/core'

export interface BoldOptions {
  /**
   * HTML 属性添加到粗体元素。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    bold: {
      /**
       * 设置一个粗体标记
       */
      setBold: () => ReturnType,
      /**
       * 切换一个粗体标记
       */
      toggleBold: () => ReturnType,
      /**
       * 取消设置一个粗体标记
       */
      unsetBold: () => ReturnType,
    }
  }
}

/**
 * 通过 `**` 作为输入匹配粗体文本。
 */
export const starInputRegex = /(?:^|\s)(\*\*(?!\s+\*\*)((?:[^*]+))\*\*(?!\s+\*\*))$/

/**
 * 粘贴时通过`**'匹配大胆的文本。
 */
export const starPasteRegex = /(?:^|\s)(\*\*(?!\s+\*\*)((?:[^*]+))\*\*(?!\s+\*\*))/g

/**
 * 通过 `__` 作为输入匹配粗体文本。
 */
export const underscoreInputRegex = /(?:^|\s)(__(?!\s+__)((?:[^_]+))__(?!\s+__))$/

/**
 * 粘贴时通过 `__` 匹配粗体文本。
 */
export const underscorePasteRegex = /(?:^|\s)(__(?!\s+__)((?:[^_]+))__(?!\s+__))/g

/**
 * 此扩展允许您将文本标记为粗体。
 * @see https://tiptap.dev/api/marks/bold
 */
export const Bold = Mark.create<BoldOptions>({
  name: 'bold',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  parseHTML() {
    return [
      {
        tag: 'strong',
      },
      {
        tag: 'b',
        getAttrs: node => (node as HTMLElement).style.fontWeight !== 'normal' && null,
      },
      {
        style: 'font-weight=400',
        clearMark: mark => mark.type.name === this.name,
      },
      {
        style: 'font-weight',
        getAttrs: value => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null,
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['strong', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setBold: () => ({ commands }) => {
        return commands.setMark(this.name)
      },
      toggleBold: () => ({ commands }) => {
        return commands.toggleMark(this.name)
      },
      unsetBold: () => ({ commands }) => {
        return commands.unsetMark(this.name)
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-b': () => this.editor.commands.toggleBold(),
      'Mod-B': () => this.editor.commands.toggleBold(),
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
