import { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Transaction } from '@tiptap/pm/state'
import { Transform } from '@tiptap/pm/transform'

/**
 * 返回一个基于传递的事务的所有步骤的新 `Transform`。
 * @param oldDoc 要从中开始的 Prosemirror 节点
 * @param transactions 要组合的事务
 * @returns 一个具有所有传递事务步骤的新 `Transform`
 */
export function combineTransactionSteps(
  oldDoc: ProseMirrorNode,
  transactions: Transaction[],
): Transform {
  const transform = new Transform(oldDoc)

  transactions.forEach(transaction => {
    transaction.steps.forEach(step => {
      transform.step(step)
    })
  })

  return transform
}
