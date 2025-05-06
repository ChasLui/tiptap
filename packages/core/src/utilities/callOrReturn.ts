import { MaybeReturnType } from '../types.js'
import { isFunction } from './isFunction.js'

/**
 * 可选地调用 `value` 作为函数。
 * 否则它直接返回。
 * @param value 函数或任何值。
 * @param context 可选上下文绑定到函数。
 * @param props 可选参数传递给函数。
 */
export function callOrReturn<T>(value: T, context: any = undefined, ...props: any[]): MaybeReturnType<T> {
  if (isFunction(value)) {
    if (context) {
      return value.bind(context)(...props)
    }

    return value(...props)
  }

  return value as MaybeReturnType<T>
}
