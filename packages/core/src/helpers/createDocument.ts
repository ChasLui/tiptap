import {
  Fragment, Node as ProseMirrorNode, ParseOptions, Schema,
} from '@tiptap/pm/model'

import { Content } from '../types.js'
import { createNodeFromContent } from './createNodeFromContent.js'

/**
 * 从内容创建一个新的 Prosemirror 文档节点。
 * @param content 要从中创建文档节点的 JSON 或 HTML 内容
 * @param schema 用于文档的 Prosemirror 架构
 * @param parseOptions 解析器的选项
 * @returns 创建的 Prosemirror 文档节点
 */
export function createDocument(
  content: Content | ProseMirrorNode | Fragment,
  schema: Schema,
  parseOptions: ParseOptions = {},
  options: { errorOnInvalidContent?: boolean } = {},
): ProseMirrorNode {
  return createNodeFromContent(content, schema, {
    slice: false,
    parseOptions,
    errorOnInvalidContent: options.errorOnInvalidContent,
  }) as ProseMirrorNode
}
