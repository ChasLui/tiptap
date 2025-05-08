import { Extensions, getSchema } from '@tiptap/core'
import { DOMParser, ParseOptions } from '@tiptap/pm/model'
import { parseHTML } from 'zeed-dom'

/**
 * 从给定的 HTML 字符串生成 JSON 对象，并将其转换为具有内容的 Prosemirror 节点。
 * @param {string} html - 要转换为 Prosemirror 节点的 HTML 字符串。
 * @param {Extensions} extensions - 用于生成模式的扩展。
 * @param {ParseOptions} options - 要提供给解析器的选项。
 * @returns {Record<string, any>} - 生成的 JSON 对象。
 * @example
 * const html = '<p>Hello, world!</p>'
 * const extensions = [...]
 * const json = generateJSON(html, extensions)
 * console.log(json) // { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello, world!' }] }] }
 */
export function generateJSON(html: string, extensions: Extensions, options?: ParseOptions): Record<string, any> {
  const schema = getSchema(extensions)
  const dom = parseHTML(html) as unknown as Node

  return DOMParser.fromSchema(schema).parse(dom, options).toJSON()
}
