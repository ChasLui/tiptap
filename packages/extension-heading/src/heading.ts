import { mergeAttributes, Node, textblockTypeInputRule } from '@tiptap/core'

/**
 * 标题级别选项。
 */
export type Level = 1 | 2 | 3 | 4 | 5 | 6

export interface HeadingOptions {
  /**
   * 可用的标题级别。
   * @default [1, 2, 3, 4, 5, 6]
   * @example [1, 2, 3]
   */
  levels: Level[],

  /**
   * 标题节点的 HTML 属性。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    heading: {
      /**
       * 设置一个标题节点
       * @param attributes 标题属性
       * @example editor.commands.setHeading({ level: 1 })
       */
      setHeading: (attributes: { level: Level }) => ReturnType,
      /**
       * 切换一个标题节点
       * @param attributes 标题属性
       * @example editor.commands.toggleHeading({ level: 1 })
       */
      toggleHeading: (attributes: { level: Level }) => ReturnType,
    }
  }
}

/**
 * 此扩展允许您创建标题。
 * @see https://www.tiptap.dev/api/nodes/heading
 */
export const Heading = Node.create<HeadingOptions>({
  name: 'heading',

  addOptions() {
    return {
      levels: [1, 2, 3, 4, 5, 6],
      HTMLAttributes: {},
    }
  },

  content: 'inline*',

  group: 'block',

  defining: true,

  addAttributes() {
    return {
      level: {
        default: 1,
        rendered: false,
      },
    }
  },

  parseHTML() {
    return this.options.levels
      .map((level: Level) => ({
        tag: `h${level}`,
        attrs: { level },
      }))
  },

  renderHTML({ node, HTMLAttributes }) {
    const hasLevel = this.options.levels.includes(node.attrs.level)
    const level = hasLevel
      ? node.attrs.level
      : this.options.levels[0]

    return [`h${level}`, mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setHeading: attributes => ({ commands }) => {
        if (!this.options.levels.includes(attributes.level)) {
          return false
        }

        return commands.setNode(this.name, attributes)
      },
      toggleHeading: attributes => ({ commands }) => {
        if (!this.options.levels.includes(attributes.level)) {
          return false
        }

        return commands.toggleNode(this.name, 'paragraph', attributes)
      },
    }
  },

  addKeyboardShortcuts() {
    return this.options.levels.reduce((items, level) => ({
      ...items,
      ...{
        [`Mod-Alt-${level}`]: () => this.editor.commands.toggleHeading({ level }),
      },
    }), {})
  },

  addInputRules() {
    return this.options.levels.map(level => {
      return textblockTypeInputRule({
        find: new RegExp(`^(#{${Math.min(...this.options.levels)},${level}})\\s$`),
        type: this.type,
        getAttributes: {
          level,
        },
      })
    })
  },
})
