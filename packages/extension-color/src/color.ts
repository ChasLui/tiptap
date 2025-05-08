import '@tiptap/extension-text-style'

import { Extension } from '@tiptap/core'

export type ColorOptions = {
  /**
   * 可以应用颜色的类型
   * @default ['textStyle']
   * @example ['heading', 'paragraph']
  */
  types: string[],
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    color: {
      /**
       * 设置文本颜色
       * @param color 要设置的颜色
       * @example editor.commands.setColor('red')
       */
      setColor: (color: string) => ReturnType,

      /**
       * 取消设置文本颜色
       * @example editor.commands.unsetColor()
       */
      unsetColor: () => ReturnType,
    }
  }
}

/**
 * 此扩展允许您为文本着色。
 * @see https://tiptap.dev/api/extensions/color
 */
export const Color = Extension.create<ColorOptions>({
  name: 'color',

  addOptions() {
    return {
      types: ['textStyle'],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          color: {
            default: null,
            parseHTML: element => element.style.color?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.color) {
                return {}
              }

              return {
                style: `color: ${attributes.color}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setColor: color => ({ chain }) => {
        return chain()
          .setMark('textStyle', { color })
          .run()
      },
      unsetColor: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { color: null })
          .removeEmptyTextStyle()
          .run()
      },
    }
  },
})
