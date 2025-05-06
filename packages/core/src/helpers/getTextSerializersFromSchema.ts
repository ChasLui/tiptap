import { Schema } from '@tiptap/pm/model'

import { TextSerializer } from '../types.js'

/**
 * 在 Prosemirror Schema中查找文本序列化器 `toText`
 * @param schema 要搜索的 Prosemirror Schema
 * @returns 一个按节点名称记录的文本序列化器
 */
export function getTextSerializersFromSchema(schema: Schema): Record<string, TextSerializer> {
  return Object.fromEntries(
    Object.entries(schema.nodes)
      .filter(([, node]) => node.spec.toText)
      .map(([name, node]) => [name, node.spec.toText]),
  )
}
