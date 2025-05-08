import '@tiptap/extension-text-style'

import { Extension } from '@tiptap/core'

export type FontFamilyOptions = {
  /**
   * 一个节点名称列表，其中可以应用字体系列。
   * @default ['textStyle']
   * @example ['heading', 'paragraph']
   */
  types: string[],
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontFamily: {
      /**
       * 设置字体系列
       * @param fontFamily 字体系列
       * @example editor.commands.setFontFamily('Arial')
       */
      setFontFamily: (fontFamily: string) => ReturnType,
      /**
       * 取消设置字体系列
       * @example editor.commands.unsetFontFamily()
       */
      unsetFontFamily: () => ReturnType,
    }
  }
}

/**
 * 此扩展允许您为文本设置字体系列。
 * @see https://www.tiptap.dev/api/extensions/font-family
 */
export const FontFamily = Extension.create<FontFamilyOptions>({
  name: 'fontFamily',

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
          fontFamily: {
            default: null,
            parseHTML: element => element.style.fontFamily,
            renderHTML: attributes => {
              if (!attributes.fontFamily) {
                return {}
              }

              return {
                style: `font-family: ${attributes.fontFamily}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontFamily: fontFamily => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontFamily })
          .run()
      },
      unsetFontFamily: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontFamily: null })
          .removeEmptyTextStyle()
          .run()
      },
    }
  },
})
