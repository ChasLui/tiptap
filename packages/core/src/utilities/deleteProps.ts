/**
 * 从对象中删除一个属性或一个属性数组。
 * @param obj 对象
 * @param key 要删除的键
 */
export function deleteProps(obj: Record<string, any>, propOrProps: string | string[]): Record<string, any> {
  const props = typeof propOrProps === 'string'
    ? [propOrProps]
    : propOrProps

  return Object
    .keys(obj)
    .reduce((newObj: Record<string, any>, prop) => {
      if (!props.includes(prop)) {
        newObj[prop] = obj[prop]
      }

      return newObj
    }, {})
}
