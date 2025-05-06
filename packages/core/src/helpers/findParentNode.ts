import { Selection } from '@tiptap/pm/state'

import { Predicate } from '../types.js'
import { findParentNodeClosestToPos } from './findParentNodeClosestToPos.js'

/**
 * 查找当前选择中匹配给定谓词的最近父节点。
 * @param predicate 要匹配的谓词
 * @returns 一个命令，用于查找当前选择中匹配给定谓词的最近父节点
 * @example ```js
 * findParentNode(node => node.type.name === 'paragraph')
 * ```
 */
export function findParentNode(predicate: Predicate) {
  return (selection: Selection) => findParentNodeClosestToPos(selection.$from, predicate)
}
