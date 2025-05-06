import { Node as ProseMirrorNode, ResolvedPos } from '@tiptap/pm/model'

import { Predicate } from '../types.js'

/**
 * 查找最接近给定位置的父节点，该节点匹配给定的谓词。
 * @param $pos 要从中搜索的解析位置
 * @param predicate 要匹配的谓词
 * @returns 最接近给定位置的父节点，该节点匹配给定的谓词
 * @example ```js
 * findParentNodeClosestToPos($from, node => node.type.name === 'paragraph')
 * ```
 */
export function findParentNodeClosestToPos(
  $pos: ResolvedPos,
  predicate: Predicate,
):
  | {
      pos: number
      start: number
      depth: number
      node: ProseMirrorNode
    }
  | undefined {
  for (let i = $pos.depth; i > 0; i -= 1) {
    const node = $pos.node(i)

    if (predicate(node)) {
      return {
        pos: i > 0 ? $pos.before(i) : 0,
        start: $pos.start(i),
        depth: i,
        node,
      }
    }
  }
}
