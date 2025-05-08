import { DOMSerializer, Node, Schema } from '@tiptap/pm/model'
import { createHTMLDocument, VHTMLDocument } from 'zeed-dom'

/**
 * 返回给定文档节点的 HTML 字符串表示。
 *
 * @param doc - 要序列化的文档节点。
 * @param schema - 用于序列化的 Prosemirror 模式。
 * @returns 文档片段的 HTML 字符串表示。
 *
 * @example
 * ```typescript
 * const html = getHTMLFromFragment(doc, schema)
 * ```
 */
export function getHTMLFromFragment(doc: Node, schema: Schema, options?: { document?: Document }): string {
  if (options?.document) {
    // 调用者依赖于他们自己的文档实现。使用这个而不是默认的 zeed-dom。
    const wrap = options.document.createElement('div')

    DOMSerializer.fromSchema(schema).serializeFragment(doc.content, { document: options.document }, wrap)
    return wrap.innerHTML
  }

  // 使用 zeed-dom 进行序列化。
  const zeedDocument = DOMSerializer.fromSchema(schema).serializeFragment(doc.content, {
    document: createHTMLDocument() as unknown as Document,
  }) as unknown as VHTMLDocument

  return zeedDocument.render()
}
