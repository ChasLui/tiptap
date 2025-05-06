import { isRegExp } from './isRegExp.js'

/**
 * 检查 object1 是否包含 object2
 * @param object1 对象
 * @param object2 对象
 */
export function objectIncludes(
  object1: Record<string, any>,
  object2: Record<string, any>,
  options: { strict: boolean } = { strict: true },
): boolean {
  const keys = Object.keys(object2)

  if (!keys.length) {
    return true
  }

  return keys.every(key => {
    if (options.strict) {
      return object2[key] === object1[key]
    }

    if (isRegExp(object2[key])) {
      return object2[key].test(object1[key])
    }

    return object2[key] === object1[key]
  })
}
