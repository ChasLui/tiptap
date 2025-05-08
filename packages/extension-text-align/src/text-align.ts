import { Extension } from '@tiptap/core'

export interface TextAlignOptions {
  /**
   * 可以应用文本对齐属性的类型。
   * @default []
   * @example ['heading', 'paragraph']
   */
  types: string[],

  /**
   * 允许的对齐方式。
   * @default ['left', 'center', 'right', 'justify']
   * @example ['left', 'right']
   */
  alignments: string[],

  /**
   * 默认对齐方式。
   * @default null
   * @example 'center'
   */
  defaultAlignment: string | null,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textAlign: {
      /**
       * 设置文本对齐属性
       * @param alignment 对齐方式
       * @example editor.commands.setTextAlign('left')
       */
      setTextAlign: (alignment: string) => ReturnType,
      /**
       * 取消文本对齐属性
       * @example editor.commands.unsetTextAlign()
       */
      unsetTextAlign: () => ReturnType,
      /**
       * 切换文本对齐属性
       * @param alignment 对齐方式
       * @example editor.commands.toggleTextAlign('right')
       */
      toggleTextAlign: (alignment: string) => ReturnType,
    }
  }
}

/**
 * 此扩展允许您对齐文本。
 * @see https://www.tiptap.dev/api/extensions/text-align
 */
export const TextAlign = Extension.create<TextAlignOptions>({
  name: 'textAlign',

  addOptions() {
    return {
      types: [],
      alignments: ['left', 'center', 'right', 'justify'],
      defaultAlignment: null,
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textAlign: {
            default: this.options.defaultAlignment,
            parseHTML: element => {
              const alignment = element.style.textAlign

              return this.options.alignments.includes(alignment) ? alignment : this.options.defaultAlignment
            },
            renderHTML: attributes => {
              if (!attributes.textAlign) {
                return {}
              }

              return { style: `text-align: ${attributes.textAlign}` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setTextAlign: (alignment: string) => ({ commands }) => {
        if (!this.options.alignments.includes(alignment)) {
          return false
        }

        return this.options.types
          .map(type => commands.updateAttributes(type, { textAlign: alignment }))
          .every(response => response)
      },

      unsetTextAlign: () => ({ commands }) => {
        return this.options.types
          .map(type => commands.resetAttributes(type, 'textAlign'))
          .every(response => response)
      },

      toggleTextAlign: alignment => ({ editor, commands }) => {
        if (!this.options.alignments.includes(alignment)) {
          return false
        }

        if (editor.isActive({ textAlign: alignment })) {
          return commands.unsetTextAlign()
        }
        return commands.setTextAlign(alignment)
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-l': () => this.editor.commands.setTextAlign('left'),
      'Mod-Shift-e': () => this.editor.commands.setTextAlign('center'),
      'Mod-Shift-r': () => this.editor.commands.setTextAlign('right'),
      'Mod-Shift-j': () => this.editor.commands.setTextAlign('justify'),
    }
  },
})
