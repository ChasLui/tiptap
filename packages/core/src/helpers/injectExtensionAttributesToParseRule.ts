import { ParseRule } from '@tiptap/pm/model'

import { ExtensionAttribute } from '../types.js'
import { fromString } from '../utilities/fromString.js'

/**
 * 此函数将扩展属性合并到解析规则属性（`attrs` 或 `getAttrs`）中。
 * 当 `getAttrs` 返回 `false` 时取消。
 * @param parseRule ProseMirror ParseRule
 * @param extensionAttributes 要注入的属性列表
 */
export function injectExtensionAttributesToParseRule(
  parseRule: ParseRule,
  extensionAttributes: ExtensionAttribute[],
): ParseRule {
  if ('style' in parseRule) {
    return parseRule
  }

  return {
    ...parseRule,
    getAttrs: (node: HTMLElement) => {
      const oldAttributes = parseRule.getAttrs ? parseRule.getAttrs(node) : parseRule.attrs

      if (oldAttributes === false) {
        return false
      }

      const newAttributes = extensionAttributes.reduce((items, item) => {
        const value = item.attribute.parseHTML
          ? item.attribute.parseHTML(node)
          : fromString((node).getAttribute(item.name))

        if (value === null || value === undefined) {
          return items
        }

        return {
          ...items,
          [item.name]: value,
        }
      }, {})

      return { ...oldAttributes, ...newAttributes }
    },
  }
}
