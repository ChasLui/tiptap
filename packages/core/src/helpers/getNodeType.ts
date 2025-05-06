import { NodeType, Schema } from '@tiptap/pm/model'

export function getNodeType(nameOrType: string | NodeType, schema: Schema): NodeType {
  if (typeof nameOrType === 'string') {
    if (!schema.nodes[nameOrType]) {
      throw Error(
        `不存在名为：'${nameOrType}' 的节点类型。也许你忘记添加扩展了？`,
      )
    }

    return schema.nodes[nameOrType]
  }

  return nameOrType
}
