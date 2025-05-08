import { Extension } from '@tiptap/core'
import { dropCursor } from '@tiptap/pm/dropcursor'

export interface DropcursorOptions {
  /**
   * 下拉光标的颜色
   * @default 'currentColor'
   * @example 'red'
   */
  color: string | undefined,

  /**
   * 下拉光标的宽度
   * @default 1
   * @example 2
  */
  width: number | undefined,

  /**
   * 下拉光标的类
   * @default undefined
   * @example 'drop-cursor'
  */
  class: string | undefined,
}

/**
 * 此扩展允许您在您的编辑器中添加一个下拉光标。
 * 下拉光标是一条线，当您拖动和放下内容时出现。
 * @see https://tiptap.dev/api/extensions/dropcursor
 */
export const Dropcursor = Extension.create<DropcursorOptions>({
  name: 'dropCursor',

  addOptions() {
    return {
      color: 'currentColor',
      width: 1,
      class: undefined,
    }
  },

  addProseMirrorPlugins() {
    return [
      dropCursor(this.options),
    ]
  },
})
