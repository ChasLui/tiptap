import { NodeType } from '@tiptap/pm/model'

import { InputRule, InputRuleFinder } from '../InputRule.js'
import { ExtendedRegExpMatchArray } from '../types.js'
import { callOrReturn } from '../utilities/callOrReturn.js'

/**
 * 构建一个输入规则，当匹配的文本输入到它时添加一个节点。
 * @see https://tiptap.dev/docs/editor/extensions/custom-extensions/extend-existing#input-rules
 */
export function nodeInputRule(config: {
  /**
   * 要匹配的正则表达式。
   */
  find: InputRuleFinder

  /**
   * 要添加的节点类型。
   */
  type: NodeType

  /**
   * 一个返回节点属性的函数
   * 也可以是一个属性对象
   */
  getAttributes?:
    | Record<string, any>
    | ((match: ExtendedRegExpMatchArray) => Record<string, any>)
    | false
    | null
}) {
  return new InputRule({
    find: config.find,
    handler: ({ state, range, match }) => {
      const attributes = callOrReturn(config.getAttributes, undefined, match) || {}
      const { tr } = state
      const start = range.from
      let end = range.to

      const newNode = config.type.create(attributes)

      if (match[1]) {
        const offset = match[0].lastIndexOf(match[1])
        let matchStart = start + offset

        if (matchStart > end) {
          matchStart = end
        } else {
          end = matchStart + match[1].length
        }

        // 插入最后一个输入的字符
        const lastChar = match[0][match[0].length - 1]

        tr.insertText(lastChar, start + match[0].length - 1)

        // 从输入规则插入节点
        tr.replaceWith(matchStart, end, newNode)
      } else if (match[0]) {
        const insertionStart = config.type.isInline ? start : start - 1

        tr.insert(insertionStart, config.type.create(attributes)).delete(
          tr.mapping.map(start),
          tr.mapping.map(end),
        )
      }

      tr.scrollIntoView()
    },
  })
}
