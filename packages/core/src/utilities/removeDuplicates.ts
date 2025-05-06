/**
 * 从数组中删除重复的值。
 * 支持数字、字符串和对象。
 */
export function removeDuplicates<T>(array: T[], by = JSON.stringify): T[] {
  const seen: Record<any, any> = {}

  return array.filter(item => {
    const key = by(item)

    return Object.prototype.hasOwnProperty.call(seen, key)
      ? false
      : (seen[key] = true)
  })
}
