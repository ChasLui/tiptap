import { Node } from '@tiptap/pm/model'

import { Extensions, JSONContent, TextSerializer } from '../types.js'
import { getSchema } from './getSchema.js'
import { getText } from './getText.js'
import { getTextSerializersFromSchema } from './getTextSerializersFromSchema.js'

/**
 * 从 JSONContent 生成原始文本
 * @param doc 要从中生成文本的 JSONContent
 * @param extensions 要用于架构的扩展
 * @param options 文本生成的选项，例如 blockSeparator 或 textSerializers
 * @returns 生成的文本
 */
export function generateText(
  doc: JSONContent,
  extensions: Extensions,
  options?: {
    blockSeparator?: string
    textSerializers?: Record<string, TextSerializer>
  },
): string {
  const { blockSeparator = '\n\n', textSerializers = {} } = options || {}
  const schema = getSchema(extensions)
  const contentNode = Node.fromJSON(schema, doc)

  return getText(contentNode, {
    blockSeparator,
    textSerializers: {
      ...getTextSerializersFromSchema(schema),
      ...textSerializers,
    },
  })
}
