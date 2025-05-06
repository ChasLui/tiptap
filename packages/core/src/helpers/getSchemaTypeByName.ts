import { MarkType, NodeType, Schema } from '@tiptap/pm/model'

/**
 * 尝试通过名称获取节点或标记类型。
 * @param name 节点或标记类型的名称
 * @param schema 要搜索的 Prosemiror 架构
 * @returns 节点或标记类型，如果它不存在则返回 null
 */
export function getSchemaTypeByName(name: string, schema: Schema): NodeType | MarkType | null {
  return schema.nodes[name] || schema.marks[name] || null
}
