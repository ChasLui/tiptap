import { RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    deleteCurrentNode: {
      /**
       * 删除当前具有选择锚点的节点。
       * @example editor.commands.deleteCurrentNode()
       */
      deleteCurrentNode: () => ReturnType,
    }
  }
}

export const deleteCurrentNode: RawCommands['deleteCurrentNode'] = () => ({ tr, dispatch }) => {
  const { selection } = tr
  const currentNode = selection.$anchor.node()

  // 如果当前节点内有内容，则退出此命令
  if (currentNode.content.size > 0) {
    return false
  }

  const $pos = tr.selection.$anchor

  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const node = $pos.node(depth)

    if (node.type === currentNode.type) {
      if (dispatch) {
        const from = $pos.before(depth)
        const to = $pos.after(depth)

        tr.delete(from, to).scrollIntoView()
      }

      return true
    }
  }

  return false
}
