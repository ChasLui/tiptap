import { Node } from '@tiptap/core'

/**
 * 此扩展允许您创建文本节点。
 * @see https://www.tiptap.dev/api/nodes/text
 */
export const Text = Node.create({
  name: 'text',
  group: 'inline',
})
