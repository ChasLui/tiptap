import { Editor, isAtStartOfNode, isNodeActive } from '@tiptap/core'
import { Node } from '@tiptap/pm/model'

import { findListItemPos } from './findListItemPos.js'
import { hasListBefore } from './hasListBefore.js'
import { hasListItemBefore } from './hasListItemBefore.js'
import { listItemHasSubList } from './listItemHasSubList.js'

export const handleBackspace = (editor: Editor, name: string, parentListTypes: string[]) => {
  // 这仍然是处理撤销处理所必需的
  if (editor.commands.undoInputRule()) {
    return true
  }

  // 如果选择不是折叠的
  // 我们可以依赖默认的退格行为
  if (editor.state.selection.from !== editor.state.selection.to) {
    return false
  }

  // 如果当前项目不是列表项中
  // 并且前一个项目是列表（有序列表或无序列表）
  // 将光标移动到列表中并删除当前项目
  if (!isNodeActive(editor.state, name) && hasListBefore(editor.state, name, parentListTypes)) {
    const { $anchor } = editor.state.selection

    const $listPos = editor.state.doc.resolve($anchor.before() - 1)

    const listDescendants: Array<{ node: Node, pos: number }> = []

    $listPos.node().descendants((node, pos) => {
      if (node.type.name === name) {
        listDescendants.push({ node, pos })
      }
    })

    const lastItem = listDescendants.at(-1)

    if (!lastItem) {
      return false
    }

    const $lastItemPos = editor.state.doc.resolve($listPos.start() + lastItem.pos + 1)

    return editor.chain().cut({ from: $anchor.start() - 1, to: $anchor.end() + 1 }, $lastItemPos.end()).joinForward().run()
  }

  // 如果光标不在当前节点类型中
  // 什么都不做并继续
  if (!isNodeActive(editor.state, name)) {
    return false
  }

  // 如果光标不在节点开始
  // 什么都不做并继续
  if (!isAtStartOfNode(editor.state)) {
    return false
  }

  const listItemPos = findListItemPos(name, editor.state)

  if (!listItemPos) {
    return false
  }

  const $prev = editor.state.doc.resolve(listItemPos.$pos.pos - 2)
  const prevNode = $prev.node(listItemPos.depth)

  const previousListItemHasSubList = listItemHasSubList(name, editor.state, prevNode)

  // 如果前一个项目是列表项并且没有子列表，则将列表项合并
  if (hasListItemBefore(name, editor.state) && !previousListItemHasSubList) {
    return editor.commands.joinItemBackward()
  }

  // 否则，在最后，一个退格键应该
  // 总是只提升列表项如果
  // 合并/合并是不可能的
  return editor.chain().liftListItem(name).run()
}
