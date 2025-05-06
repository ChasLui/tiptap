import { Schema } from '@tiptap/pm/model'

/**
 * 获取架构项的类型。
 * @param name 架构项的名称
 * @param schema 要搜索的 Prosemiror 架构
 * @returns 架构项的类型（`node` 或 `mark`），如果它不存在则返回 null
 */
export function getSchemaTypeNameByName(name: string, schema: Schema): 'node' | 'mark' | null {
  if (schema.nodes[name]) {
    return 'node'
  }

  if (schema.marks[name]) {
    return 'mark'
  }

  return null
}
