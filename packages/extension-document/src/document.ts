import { Node } from '@tiptap/core'

/**
 * 默认文档节点，表示编辑器顶级节点。
 * @see https://tiptap.dev/api/nodes/document
 */
export const Document = Node.create({
  name: 'doc',
  topNode: true,
  content: 'block+',
})
