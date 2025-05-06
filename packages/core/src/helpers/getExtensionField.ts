import { AnyExtension, MaybeThisParameterType, RemoveThis } from '../types.js'

/**
 * 从扩展返回一个字段
 * @param extension 一个 Tiptap 扩展
 * @param field 一个字段，例如 `renderHTML` 或 `priority`
 * @param context 应该作为 `this` 传递给函数的上下文对象
 * @returns 字段值
 */
export function getExtensionField<T = any>(
  extension: AnyExtension,
  field: string,
  context?: Omit<MaybeThisParameterType<T>, 'parent'>,
): RemoveThis<T> {

  if (extension.config[field] === undefined && extension.parent) {
    return getExtensionField(extension.parent, field, context)
  }

  if (typeof extension.config[field] === 'function') {
    const value = extension.config[field].bind({
      ...context,
      parent: extension.parent
        ? getExtensionField(extension.parent, field, context)
        : null,
    })

    return value
  }

  return extension.config[field]
}
