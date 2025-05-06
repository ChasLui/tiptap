import { Node, NodeType } from '@tiptap/pm/model'
import { EditorState } from '@tiptap/pm/state'

/**
 * 在当前选择中查找给定类型或名称的第一个节点。
 * @param state 编辑器状态。
 * @param typeOrName 节点类型或名称。
 * @param pos 要从哪个位置开始搜索。
 * @param maxDepth 要搜索的最大深度。
 * @returns 节点和深度作为数组。
 */
export const getNodeAtPosition = (state: EditorState, typeOrName: string | NodeType, pos: number, maxDepth = 20) => {
  const $pos = state.doc.resolve(pos)

  let currentDepth = maxDepth
  let node: Node | null = null

  while (currentDepth > 0 && node === null) {
    const currentNode = $pos.node(currentDepth)

    if (currentNode?.type.name === typeOrName) {
      node = currentNode
    } else {
      currentDepth -= 1
    }
  }

  return [node, currentDepth] as [Node | null, number]
}
