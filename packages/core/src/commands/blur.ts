import { RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blur: {
      /**
       * 从编辑器中移除焦点。
       * @example editor.commands.blur()
       */
      blur: () => ReturnType,
    }
  }
}

export const blur: RawCommands['blur'] = () => ({ editor, view }) => {
  requestAnimationFrame(() => {
    if (!editor.isDestroyed) {
      (view.dom as HTMLElement).blur()

      // 浏览器应该在失去焦点时删除光标，但 Safari 不这样做。
      // 见: https://github.com/ueberdosis/tiptap/issues/2405
      window?.getSelection()?.removeAllRanges()
    }
  })

  return true
}
