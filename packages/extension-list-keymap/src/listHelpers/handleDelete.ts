import { Editor, isAtEndOfNode, isNodeActive } from '@tiptap/core'

import { nextListIsDeeper } from './nextListIsDeeper.js'
import { nextListIsHigher } from './nextListIsHigher.js'

export const handleDelete = (editor: Editor, name: string) => {
  // 如果光标不在当前节点类型中
  // 什么都不做并继续
  if (!isNodeActive(editor.state, name)) {
    return false
  }

  // 如果光标不在节点结束
  // 什么都不做并继续
  if (!isAtEndOfNode(editor.state, name)) {
    return false
  }

  // 如果选择不是折叠的，或者不在单个节点中
  // 什么都不做并继续
  const { selection } = editor.state
  const { $from, $to } = selection

  if (!selection.empty && $from.sameParent($to)) {
    return false
  }

  // 检查下一个节点是否是一个具有更深深度的列表
  if (nextListIsDeeper(name, editor.state)) {
    return editor
      .chain()
      .focus(editor.state.selection.from + 4)
      .lift(name)
      .joinBackward()
      .run()
  }

  if (nextListIsHigher(name, editor.state)) {
    return editor.chain()
      .joinForward()
      .joinBackward()
      .run()
  }

  return editor.commands.joinItemForward()
}
