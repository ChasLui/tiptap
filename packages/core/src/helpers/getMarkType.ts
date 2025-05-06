import { MarkType, Schema } from '@tiptap/pm/model'

export function getMarkType(nameOrType: string | MarkType, schema: Schema): MarkType {
  if (typeof nameOrType === 'string') {
    if (!schema.marks[nameOrType]) {
      throw Error(
        `不存在名为： '${nameOrType}' 的标记类型。也许你忘记添加扩展了？`,
      )
    }

    return schema.marks[nameOrType]
  }

  return nameOrType
}
