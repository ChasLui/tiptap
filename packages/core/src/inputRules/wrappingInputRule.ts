import { Node as ProseMirrorNode, NodeType } from '@tiptap/pm/model'
import { canJoin, findWrapping } from '@tiptap/pm/transform'

import { Editor } from '../Editor.js'
import { InputRule, InputRuleFinder } from '../InputRule.js'
import { ExtendedRegExpMatchArray } from '../types.js'
import { callOrReturn } from '../utilities/callOrReturn.js'

/**
 * 构建一个输入规则，当输入给定的字符串时自动包裹一个文本块。
 * 当使用正则表达式时，你可能想在正则表达式开始时使用 `^`，
 * 这样模式只能出现在文本块的开始处。
 *
 * `type` 是要包裹的节点类型。
 *
 * 默认情况下，如果有一个相同类型的节点在包裹的节点之上，
 * 规则将尝试加入这两个节点。你可以传递一个 join 谓词，
 * 它接受一个正则表达式匹配和包裹节点之前的节点，
 * 并可以返回一个布尔值来指示是否应该加入节点。
 * @see https://tiptap.dev/docs/editor/extensions/custom-extensions/extend-existing#input-rules
 */
export function wrappingInputRule(config: {
  find: InputRuleFinder,
  type: NodeType,
  keepMarks?: boolean,
  keepAttributes?: boolean,
  editor?: Editor
  getAttributes?:
  | Record<string, any>
  | ((match: ExtendedRegExpMatchArray) => Record<string, any>)
  | false
  | null
  ,
  joinPredicate?: (match: ExtendedRegExpMatchArray, node: ProseMirrorNode) => boolean,
}) {
  return new InputRule({
    find: config.find,
    handler: ({
      state, range, match, chain,
    }) => {
      const attributes = callOrReturn(config.getAttributes, undefined, match) || {}
      const tr = state.tr.delete(range.from, range.to)
      const $start = tr.doc.resolve(range.from)
      const blockRange = $start.blockRange()
      const wrapping = blockRange && findWrapping(blockRange, config.type, attributes)

      if (!wrapping) {
        return null
      }

      tr.wrap(blockRange, wrapping)

      if (config.keepMarks && config.editor) {
        const { selection, storedMarks } = state
        const { splittableMarks } = config.editor.extensionManager
        const marks = storedMarks || (selection.$to.parentOffset && selection.$from.marks())

        if (marks) {
          const filteredMarks = marks.filter(mark => splittableMarks.includes(mark.type.name))

          tr.ensureMarks(filteredMarks)
        }
      }
      if (config.keepAttributes) {
        /** 如果节点类型是 `bulletList` 或 `orderedList`，设置 `nodeType` 为 `listItem` */
        const nodeType = config.type.name === 'bulletList' || config.type.name === 'orderedList' ? 'listItem' : 'taskList'

        chain().updateAttributes(nodeType, attributes).run()
      }

      const before = tr.doc.resolve(range.from - 1).nodeBefore

      if (
        before
        && before.type === config.type
        && canJoin(tr.doc, range.from - 1)
        && (!config.joinPredicate || config.joinPredicate(match, before))
      ) {
        tr.join(range.from - 1)
      }
    },
  })
}
