import { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { NodeWithPos, Predicate, Range } from '../types.js'

/**
 * 与 `findChildren` 相同，但仅在 `range` 中搜索。
 * @param node 要搜索的 Prosemirror 节点
 * @param range 要搜索的范围
 * @param predicate 要匹配的谓词
 * @returns 一个包含节点及其位置的数组
 */
export function findChildrenInRange(
  node: ProseMirrorNode,
  range: Range,
  predicate: Predicate,
): NodeWithPos[] {
  const nodesWithPos: NodeWithPos[] = []

  // if (range.from === range.to) {
  //   const nodeAt = node.nodeAt(range.from)

  //   if (nodeAt) {
  //     nodesWithPos.push({
  //       node: nodeAt,
  //       pos: range.from,
  //     })
  //   }
  // }

  node.nodesBetween(range.from, range.to, (child, pos) => {
    if (predicate(child)) {
      nodesWithPos.push({
        node: child,
        pos,
      })
    }
  })

  return nodesWithPos
}
