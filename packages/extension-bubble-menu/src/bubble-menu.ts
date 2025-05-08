import { Extension } from '@tiptap/core'

import { BubbleMenuPlugin, BubbleMenuPluginProps } from './bubble-menu-plugin.js'

export type BubbleMenuOptions = Omit<BubbleMenuPluginProps, 'editor' | 'element'> & {
  /**
   * 包含您的菜单的 DOM 元素。
   * @type {HTMLElement}
   * @default null
   */
  element: HTMLElement | null,
}

/**
 * 此扩展允许您创建一个气泡菜单。
 * @see https://tiptap.dev/api/extensions/bubble-menu
 */
export const BubbleMenu = Extension.create<BubbleMenuOptions>({
  name: 'bubbleMenu',

  addOptions() {
    return {
      element: null,
      tippyOptions: {},
      pluginKey: 'bubbleMenu',
      updateDelay: undefined,
      shouldShow: null,
    }
  },

  addProseMirrorPlugins() {
    if (!this.options.element) {
      return []
    }

    return [
      BubbleMenuPlugin({
        pluginKey: this.options.pluginKey,
        editor: this.editor,
        element: this.options.element,
        tippyOptions: this.options.tippyOptions,
        updateDelay: this.options.updateDelay,
        shouldShow: this.options.shouldShow,
      }),
    ]
  },
})
