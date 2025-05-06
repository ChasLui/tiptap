import { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { TextSerializer } from '../types.js'
import { getTextBetween } from './getTextBetween.js'

/**
 * 获取 Prosemirror 节点的文本
 * @param node Prosemirror 节点
 * @param options 文本序列化器和块分隔符的选项
 * @returns 节点的文本
 * @example ```js
 * const text = getText(node, { blockSeparator: '\n' })
 * ```
 */
export function getText(
  node: ProseMirrorNode,
  options?: {
    blockSeparator?: string
    textSerializers?: Record<string, TextSerializer>
  },
) {
  const range = {
    from: 0,
    to: node.content.size,
  }

  return getTextBetween(node, range, options)
}
