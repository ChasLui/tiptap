import { Node } from '@tiptap/pm/model'

import { Extensions, JSONContent } from '../types.js'
import { getHTMLFromFragment } from './getHTMLFromFragment.js'
import { getSchema } from './getSchema.js'

/**
 * 从 JSONContent 生成 HTML
 * @param doc 要从中生成 HTML 的 JSONContent
 * @param extensions 要用于架构的扩展
 * @returns 生成的 HTML
 */
export function generateHTML(doc: JSONContent, extensions: Extensions): string {
  const schema = getSchema(extensions)
  const contentNode = Node.fromJSON(schema, doc)

  return getHTMLFromFragment(contentNode.content, schema)
}
