import { ContentMatch, NodeType } from '@tiptap/pm/model'

/**
 * 获取给定匹配的默认块类型。
 * @param match 要从中获取默认块类型的内容匹配
 * @returns 默认块类型或 null
 */
export function defaultBlockAt(match: ContentMatch): NodeType | null {
  for (let i = 0; i < match.edgeCount; i += 1) {
    const { type } = match.edge(i)

    if (type.isTextblock && !type.hasRequiredAttrs()) {
      return type
    }
  }

  return null
}
