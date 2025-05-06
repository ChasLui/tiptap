import { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { NodeWithPos, Predicate } from '../types.js'

/**
 * 查找匹配给定谓词的 Prosemirror 节点。
 * @param node 要搜索的 Prosemirror 节点
 * @param predicate 要匹配的谓词
 * @returns 一个包含节点及其位置的数组
 */
export function findChildren(node: ProseMirrorNode, predicate: Predicate): NodeWithPos[] {
  const nodesWithPos: NodeWithPos[] = []

  node.descendants((child, pos) => {
    if (predicate(child)) {
      nodesWithPos.push({
        node: child,
        pos,
      })
    }
  })

  return nodesWithPos
}
