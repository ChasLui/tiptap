import type { Schema } from '@tiptap/pm/model'

import type { JSONContent } from '../types.js'

type RewriteUnknownContentOptions = {
  /**
   * 如果为 true，未知节点将被视为段落
   * @default true
   */
  fallbackToParagraph?: boolean;
};

type RewrittenContent = {
  /**
   * 被重写的原始 JSON 内容
   */
  original: JSONContent;
  /**
   * 未支持的节点或标记的名称
   */
  unsupported: string;
}[];

/**
 * 重写未知节点和标记的实际实现
 */
function rewriteUnknownContentInner({
  json,
  validMarks,
  validNodes,
  options,
  rewrittenContent = [],
}: {
  json: JSONContent;
  validMarks: Set<string>;
  validNodes: Set<string>;
  options?: RewriteUnknownContentOptions;
  rewrittenContent?: RewrittenContent;
}): {
  /**
   * 清理后的 JSON 内容
   */
  json: JSONContent | null;
  /**
   * 被重写的节点和标记的数组
   */
  rewrittenContent: RewrittenContent;
} {
  if (json.marks && Array.isArray(json.marks)) {
    json.marks = json.marks.filter(mark => {
      const name = typeof mark === 'string' ? mark : mark.type

      if (validMarks.has(name)) {
        return true
      }

      rewrittenContent.push({
        original: JSON.parse(JSON.stringify(mark)),
        unsupported: name,
      })
      // 忽略任何未知的标记
      return false
    })
  }

  if (json.content && Array.isArray(json.content)) {
    json.content = json.content
      .map(
        value => rewriteUnknownContentInner({
          json: value,
          validMarks,
          validNodes,
          options,
          rewrittenContent,
        }).json,
      )
      .filter(a => a !== null && a !== undefined)
  }

  if (json.type && !validNodes.has(json.type)) {
    rewrittenContent.push({
      original: JSON.parse(JSON.stringify(json)),
      unsupported: json.type,
    })

    if (json.content && Array.isArray(json.content) && (options?.fallbackToParagraph !== false)) {
      // 像段落一样处理它，希望一切顺利
      json.type = 'paragraph'

      return {
        json,
        rewrittenContent,
      }
    }

    // 或者完全省略它
    return {
      json: null,
      rewrittenContent,
    }
  }

  return { json, rewrittenContent }
}

/**
 * 重写 JSON 内容中的未知节点和标记
 * 允许用户在编辑器中使用未支持的节点和标记
 */
export function rewriteUnknownContent(
  /**
   * 要清理的 JSON 内容
   */
  json: JSONContent,
  /**
   * 用于验证的架构
   */
  schema: Schema,
  /**
   * 清理过程的选项
   */
  options?: RewriteUnknownContentOptions,
): {
  /**
   * 清理后的 JSON 内容
   */
  json: JSONContent | null;
  /**
   * 被重写的节点和标记的数组
   */
  rewrittenContent: {
    /**
     * 被重写的原始 JSON 内容
     */
    original: JSONContent;
    /**
     * 未支持的节点或标记的名称
     */
    unsupported: string;
  }[];
} {
  return rewriteUnknownContentInner({
    json,
    validNodes: new Set(Object.keys(schema.nodes)),
    validMarks: new Set(Object.keys(schema.marks)),
    options,
  })
}
