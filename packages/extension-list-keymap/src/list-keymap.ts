import { Extension } from '@tiptap/core'

import { handleBackspace, handleDelete } from './listHelpers/index.js'

export type ListKeymapOptions = {
  /**
   * 一个列表类型的数组。这用于项目和包装器列表匹配。
   * @default []
   * @example [{ itemName: 'listItem', wrapperNames: ['bulletList', 'orderedList'] }]
   */
  listTypes: Array<{
    itemName: string,
    wrapperNames: string[],
  }>
}

/**
 * 此扩展注册自定义快捷键以更改退格键和删除键的行为。
 * 默认情况下，Prosemirror 键处理总是提升或下沉项目，所以段落被加入到相邻或前一个列表项中。
 * 此扩展将防止这种行为，并尝试将两个列表项中的段落加入到一个列表项中。
 * @see https://www.tiptap.dev/api/extensions/list-keymap
 */
export const ListKeymap = Extension.create<ListKeymapOptions>({
  name: 'listKeymap',

  addOptions() {
    return {
      listTypes: [
        {
          itemName: 'listItem',
          wrapperNames: ['bulletList', 'orderedList'],
        },
        {
          itemName: 'taskItem',
          wrapperNames: ['taskList'],
        },
      ],
    }
  },

  addKeyboardShortcuts() {
    return {
      Delete: ({ editor }) => {
        let handled = false

        this.options.listTypes.forEach(({ itemName }) => {
          if (editor.state.schema.nodes[itemName] === undefined) {
            return
          }

          if (handleDelete(editor, itemName)) {
            handled = true
          }
        })

        return handled
      },
      'Mod-Delete': ({ editor }) => {
        let handled = false

        this.options.listTypes.forEach(({ itemName }) => {
          if (editor.state.schema.nodes[itemName] === undefined) {
            return
          }

          if (handleDelete(editor, itemName)) {
            handled = true
          }
        })

        return handled
      },
      Backspace: ({ editor }) => {
        let handled = false

        this.options.listTypes.forEach(({ itemName, wrapperNames }) => {
          if (editor.state.schema.nodes[itemName] === undefined) {
            return
          }

          if (handleBackspace(editor, itemName, wrapperNames)) {
            handled = true
          }
        })

        return handled
      },
      'Mod-Backspace': ({ editor }) => {
        let handled = false

        this.options.listTypes.forEach(({ itemName, wrapperNames }) => {
          if (editor.state.schema.nodes[itemName] === undefined) {
            return
          }

          if (handleBackspace(editor, itemName, wrapperNames)) {
            handled = true
          }
        })

        return handled
      },
    }
  },
})
