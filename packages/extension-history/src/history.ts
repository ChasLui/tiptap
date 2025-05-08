import { Extension } from '@tiptap/core'
import { history, redo, undo } from '@tiptap/pm/history'

export interface HistoryOptions {
  /**
   * 收集历史事件的次数，直到最旧的事件被丢弃。
   * @default 100
   * @example 50
   */
  depth: number,

  /**
   * 在更改之间（以毫秒为单位）的延迟，直到应该开始一个新的组。
   * @default 500
   * @example 1000
   */
  newGroupDelay: number,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    history: {
      /**
       * 撤销最近的更改
       * @example editor.commands.undo()
       */
      undo: () => ReturnType,
      /**
       * 重新应用反转的更改
       * @example editor.commands.redo()
       */
      redo: () => ReturnType,
    }
  }
}

/**
 * 此扩展允许您撤销和重做最近的更改。
 * @see https://www.tiptap.dev/api/extensions/history
 *
 * **重要**: 如果使用 `@tiptap/extension-collaboration` 包，请确保删除 `history` 扩展，因为它与 `collaboration` 扩展不兼容。
 *
 * `@tiptap/extension-collaboration` 使用自己的历史实现。
 */
export const History = Extension.create<HistoryOptions>({
  name: 'history',

  addOptions() {
    return {
      depth: 100,
      newGroupDelay: 500,
    }
  },

  addCommands() {
    return {
      undo: () => ({ state, dispatch }) => {
        return undo(state, dispatch)
      },
      redo: () => ({ state, dispatch }) => {
        return redo(state, dispatch)
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      history(this.options),
    ]
  },

  addKeyboardShortcuts() {
    return {
      'Mod-z': () => this.editor.commands.undo(),
      'Shift-Mod-z': () => this.editor.commands.redo(),
      'Mod-y': () => this.editor.commands.redo(),

      // 俄罗斯键盘布局
      'Mod-я': () => this.editor.commands.undo(),
      'Shift-Mod-я': () => this.editor.commands.redo(),
    }
  },
})
