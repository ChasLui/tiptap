import { MarkType, NodeType } from '@tiptap/pm/model'
import { EditorState } from '@tiptap/pm/state'

import { getMarkAttributes } from './getMarkAttributes.js'
import { getNodeAttributes } from './getNodeAttributes.js'
import { getSchemaTypeNameByName } from './getSchemaTypeNameByName.js'

/**
 * 获取当前编辑器状态中按类型或名称获取节点或标记属性
 * @param state 当前编辑器状态
 * @param typeOrName 节点或标记类型或名称
 * @returns 节点的属性或标记的属性或空对象
 */
export function getAttributes(
  state: EditorState,
  typeOrName: string | NodeType | MarkType,
): Record<string, any> {
  const schemaType = getSchemaTypeNameByName(
    typeof typeOrName === 'string' ? typeOrName : typeOrName.name,
    state.schema,
  )

  if (schemaType === 'node') {
    return getNodeAttributes(state, typeOrName as NodeType)
  }

  if (schemaType === 'mark') {
    return getMarkAttributes(state, typeOrName as MarkType)
  }

  return {}
}
