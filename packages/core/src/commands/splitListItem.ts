import {
  Fragment, Node as ProseMirrorNode, NodeType, Slice,
} from '@tiptap/pm/model'
import { TextSelection } from '@tiptap/pm/state'
import { canSplit } from '@tiptap/pm/transform'

import { getNodeType } from '../helpers/getNodeType.js'
import { getSplittedAttributes } from '../helpers/getSplittedAttributes.js'
import { RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    splitListItem: {
      /**
       * 将一个列表项分成两个列表项。
       * @param typeOrName 节点的类型或名称。
       * @param overrideAttrs 要在新节点上确保的属性。
       * @example editor.commands.splitListItem('listItem')
       */
      splitListItem: (typeOrName: string | NodeType, overrideAttrs?: Record<string, any>) => ReturnType
    }
  }
}

export const splitListItem: RawCommands['splitListItem'] = (typeOrName, overrideAttrs = {}) => ({
  tr, state, dispatch, editor,
}) => {
  const type = getNodeType(typeOrName, state.schema)
  const { $from, $to } = state.selection

  // @ts-ignore
  // eslint-disable-next-line
    const node: ProseMirrorNode = state.selection.node

  if ((node && node.isBlock) || $from.depth < 2 || !$from.sameParent($to)) {
    return false
  }

  const grandParent = $from.node(-1)

  if (grandParent.type !== type) {
    return false
  }

  const extensionAttributes = editor.extensionManager.attributes

  if ($from.parent.content.size === 0 && $from.node(-1).childCount === $from.indexAfter(-1)) {
    // 在一个空块中。如果这是一个嵌套列表，包装列表项应该被分割。否则，退出并让下一个命令处理提升。
    if (
      $from.depth === 2
        || $from.node(-3).type !== type
        || $from.index(-2) !== $from.node(-2).childCount - 1
    ) {
      return false
    }

    if (dispatch) {
      let wrap = Fragment.empty
      // eslint-disable-next-line
        const depthBefore = $from.index(-1) ? 1 : $from.index(-2) ? 2 : 3

      // 构建一个包含从外部列表项到光标父节点的结构的空版本片段
      for (let d = $from.depth - depthBefore; d >= $from.depth - 3; d -= 1) {
        wrap = Fragment.from($from.node(d).copy(wrap))
      }

      // eslint-disable-next-line
        const depthAfter = $from.indexAfter(-1) < $from.node(-2).childCount ? 1 : $from.indexAfter(-2) < $from.node(-3).childCount ? 2 : 3

      // 添加一个具有空默认开始节点的第二个列表项
      const newNextTypeAttributes = {
        ...getSplittedAttributes(
          extensionAttributes,
          $from.node().type.name,
          $from.node().attrs,
        ),
        ...overrideAttrs,
      }
      const nextType = type.contentMatch.defaultType?.createAndFill(newNextTypeAttributes) || undefined

      wrap = wrap.append(Fragment.from(type.createAndFill(null, nextType) || undefined))

      const start = $from.before($from.depth - (depthBefore - 1))

      tr.replace(start, $from.after(-depthAfter), new Slice(wrap, 4 - depthBefore, 0))

      let sel = -1

      tr.doc.nodesBetween(start, tr.doc.content.size, (n, pos) => {
        if (sel > -1) {
          return false
        }

        if (n.isTextblock && n.content.size === 0) {
          sel = pos + 1
        }
      })

      if (sel > -1) {
        tr.setSelection(TextSelection.near(tr.doc.resolve(sel)))
      }

      tr.scrollIntoView()
    }

    return true
  }

  const nextType = $to.pos === $from.end() ? grandParent.contentMatchAt(0).defaultType : null

  const newTypeAttributes = {
    ...getSplittedAttributes(
      extensionAttributes,
      grandParent.type.name,
      grandParent.attrs,
    ),
    ...overrideAttrs,
  }
  const newNextTypeAttributes = {
    ...getSplittedAttributes(
      extensionAttributes,
      $from.node().type.name,
      $from.node().attrs,
    ),
    ...overrideAttrs,
  }

  tr.delete($from.pos, $to.pos)

  const types = nextType
    ? [
      { type, attrs: newTypeAttributes },
      { type: nextType, attrs: newNextTypeAttributes },
    ]
    : [{ type, attrs: newTypeAttributes }]

  if (!canSplit(tr.doc, $from.pos, 2)) {
    return false
  }

  if (dispatch) {
    const { selection, storedMarks } = state
    const { splittableMarks } = editor.extensionManager
    const marks = storedMarks || (selection.$to.parentOffset && selection.$from.marks())

    tr.split($from.pos, 2, types).scrollIntoView()

    if (!marks || !dispatch) {
      return true
    }

    const filteredMarks = marks.filter(mark => splittableMarks.includes(mark.type.name))

    tr.ensureMarks(filteredMarks)
  }

  return true
}
