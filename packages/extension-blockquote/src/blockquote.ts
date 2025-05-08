import { mergeAttributes, Node, wrappingInputRule } from '@tiptap/core'

export interface BlockquoteOptions {
  /**
   * HTML 属性添加到块引用元素。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockQuote: {
      /**
       * 设置一个块引用节点
       */
      setBlockquote: () => ReturnType,
      /**
       * 切换一个块引用节点
       */
      toggleBlockquote: () => ReturnType,
      /**
       * 取消设置一个块引用节点
       */
      unsetBlockquote: () => ReturnType,
    }
  }
}

/**
 * 通过 `>` 作为输入匹配一个块引用。
 */
export const inputRegex = /^\s*>\s$/

/**
 * 此扩展允许您创建块引用。
 * @see https://tiptap.dev/api/nodes/blockquote
 */
export const Blockquote = Node.create<BlockquoteOptions>({

  name: 'blockquote',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  content: 'block+',

  group: 'block',

  defining: true,

  parseHTML() {
    return [
      { tag: 'blockquote' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['blockquote', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setBlockquote: () => ({ commands }) => {
        return commands.wrapIn(this.name)
      },
      toggleBlockquote: () => ({ commands }) => {
        return commands.toggleWrap(this.name)
      },
      unsetBlockquote: () => ({ commands }) => {
        return commands.lift(this.name)
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-b': () => this.editor.commands.toggleBlockquote(),
    }
  },

  addInputRules() {
    return [
      wrappingInputRule({
        find: inputRegex,
        type: this.type,
      }),
    ]
  },
})
