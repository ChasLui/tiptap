import { Transaction } from '@tiptap/pm/state'
import { ySyncPluginKey } from 'y-prosemirror'

/**
 * 检查事务是否由 Yjs 更改发起。
 * @param {Transaction} transaction - 要检查的事务。
 * @returns {boolean} - 如果事务由 Yjs 更改发起，返回 true，否则返回 false。
 * @example
 * const transaction = new Transaction(doc)
 * const isOrigin = isChangeOrigin(transaction) // returns false
 */
export function isChangeOrigin(transaction: Transaction): boolean {
  return !!transaction.getMeta(ySyncPluginKey)
}
