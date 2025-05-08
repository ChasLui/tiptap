import CodeBlock, { CodeBlockOptions } from '@tiptap/extension-code-block'

import { LowlightPlugin } from './lowlight-plugin.js'

export interface CodeBlockLowlightOptions extends CodeBlockOptions {
  /**
   * lowlight 实例。
   */
  lowlight: any,
}

/**
 * 此扩展允许您使用 lowlight 突出显示代码块。
 * @see https://tiptap.dev/api/nodes/code-block-lowlight
 */
export const CodeBlockLowlight = CodeBlock.extend<CodeBlockLowlightOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      lowlight: {},
      languageClassPrefix: 'language-',
      exitOnTripleEnter: true,
      exitOnArrowDown: true,
      defaultLanguage: null,
      HTMLAttributes: {},
    }
  },

  addProseMirrorPlugins() {
    return [
      ...this.parent?.() || [],
      LowlightPlugin({
        name: this.name,
        lowlight: this.options.lowlight,
        defaultLanguage: this.options.defaultLanguage,
      }),
    ]
  },
})
