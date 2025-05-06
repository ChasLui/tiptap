import { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { Range, TextSerializer } from '../types.js'

/**
 * 获取两个位置之间的文本
 * 并使用给定的文本序列化器和块分隔符（见 getText）序列化它
 * @param startNode 要从哪个 Prosemirror 节点开始
 * @param range 要获取的文本范围
 * @param options 文本序列化器和块分隔符的选项
 * @returns 两个位置之间的文本
 */
export function getTextBetween(
  startNode: ProseMirrorNode,
  range: Range,
  options?: {
    blockSeparator?: string
    textSerializers?: Record<string, TextSerializer>
  },
): string {
  const { from, to } = range
  const { blockSeparator = '\n\n', textSerializers = {} } = options || {}
  let text = ''

  startNode.nodesBetween(from, to, (node, pos, parent, index) => {
    if (node.isBlock && pos > from) {
      text += blockSeparator
    }

    const textSerializer = textSerializers?.[node.type.name]

    if (textSerializer) {
      if (parent) {
        text += textSerializer({
          node,
          pos,
          parent,
          index,
          range,
        })
      }
      // do not descend into child nodes when there exists a serializer
      return false
    }

    if (node.isText) {
      text += node?.text?.slice(Math.max(from, pos) - pos, to - pos) // eslint-disable-line
    }
  })

  return text
}
