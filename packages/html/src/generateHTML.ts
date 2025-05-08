import { Extensions, getSchema, JSONContent } from '@tiptap/core'
import { Node } from '@tiptap/pm/model'

import { getHTMLFromFragment } from './getHTMLFromFragment.js'

/**
 * 从 ProseMirror JSON 内容对象生成 HTML。
 * @param doc - ProseMirror JSON 内容对象。
 * @param extensions - 用于构建模式的 Tiptap 扩展。
 * @returns 生成的 HTML 字符串。
 * @example
 * const doc = {
 *   type: 'doc',
 *   content: [
 *     {
 *       type: 'paragraph',
 *       content: [
 *         {
 *           type: 'text',
 *           text: 'Hello world!'
 *         }
 *       ]
 *     }
 *   ]
 * }
 * const extensions = [...]
 * const html = generateHTML(doc, extensions)
 */
export function generateHTML(doc: JSONContent, extensions: Extensions): string {
  const schema = getSchema(extensions)
  const contentNode = Node.fromJSON(schema, doc)

  return getHTMLFromFragment(contentNode, schema)
}
