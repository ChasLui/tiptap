import { ExtensionAttribute } from '../types.js'

/**
 * 返回扩展属性中应按 keepOnSplit 标志拆分的属性
 * @param extensionAttributes 扩展属性的数组
 * @param typeName 扩展的类型
 * @param attributes 扩展的属性
 * @returns 拆分的属性
 */
export function getSplittedAttributes(
  extensionAttributes: ExtensionAttribute[],
  typeName: string,
  attributes: Record<string, any>,
): Record<string, any> {
  return Object.fromEntries(Object
    .entries(attributes)
    .filter(([name]) => {
      const extensionAttribute = extensionAttributes.find(item => {
        return item.type === typeName && item.name === name
      })

      if (!extensionAttribute) {
        return false
      }

      return extensionAttribute.attribute.keepOnSplit
    }))
}
