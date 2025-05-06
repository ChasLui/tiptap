import { DOMParser } from '@tiptap/pm/model'

import { Extensions } from '../types.js'
import { elementFromString } from '../utilities/elementFromString.js'
import { getSchema } from './getSchema.js'

/**
 * 从 HTML 生成 JSONContent
 * @param html 要从中生成 JSONContent 的 HTML
 * @param extensions 要用于架构的扩展
 * @returns 生成的 JSONContent
 */
export function generateJSON(html: string, extensions: Extensions): Record<string, any> {
  const schema = getSchema(extensions)
  const dom = elementFromString(html)

  return DOMParser.fromSchema(schema).parse(dom).toJSON()
}
