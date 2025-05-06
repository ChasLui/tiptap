import { Mark as ProseMirrorMark, MarkType, ResolvedPos } from '@tiptap/pm/model'

import { Range } from '../types.js'
import { objectIncludes } from '../utilities/objectIncludes.js'

function findMarkInSet(
  marks: ProseMirrorMark[],
  type: MarkType,
  attributes: Record<string, any> = {},
): ProseMirrorMark | undefined {
  return marks.find(item => {
    return (
      item.type === type
      && objectIncludes(
        // 仅检查提供的属性
        Object.fromEntries(Object.keys(attributes).map(k => [k, item.attrs[k]])),
        attributes,
      )
    )
  })
}

function isMarkInSet(
  marks: ProseMirrorMark[],
  type: MarkType,
  attributes: Record<string, any> = {},
): boolean {
  return !!findMarkInSet(marks, type, attributes)
}

/**
 * 获取在解析位置的标记范围。
 */
export function getMarkRange(
  /**
   * 要获取标记范围的位置。
   */
  $pos: ResolvedPos,
  /**
   * 要获取标记范围的标记类型。
   */
  type: MarkType,
  /**
   * 要匹配的属性。
   * 如果未提供，则仅匹配位置处的第一个标记。
   */
  attributes?: Record<string, any>,
): Range | void {
  if (!$pos || !type) {
    return
  }
  let start = $pos.parent.childAfter($pos.parentOffset)

  // 如果光标位于没有标记的文本节点，则向后查找
  if (!start.node || !start.node.marks.some(mark => mark.type === type)) {
    start = $pos.parent.childBefore($pos.parentOffset)
  }

  // 如果向后查找也没有标记，则返回 undefined
  if (!start.node || !start.node.marks.some(mark => mark.type === type)) {
    return
  }

  // 默认只匹配第一个标记的属性
  attributes = attributes || start.node.marks[0]?.attrs

  // 现在我们知道光标位于具有指定标记的文本节点，因此我们可以查找它
  const mark = findMarkInSet([...start.node.marks], type, attributes)

  if (!mark) {
    return
  }

  let startIndex = start.index
  let startPos = $pos.start() + start.offset
  let endIndex = startIndex + 1
  let endPos = startPos + start.node.nodeSize

  while (
    startIndex > 0
    && isMarkInSet([...$pos.parent.child(startIndex - 1).marks], type, attributes)
  ) {
    startIndex -= 1
    startPos -= $pos.parent.child(startIndex).nodeSize
  }

  while (
    endIndex < $pos.parent.childCount
    && isMarkInSet([...$pos.parent.child(endIndex).marks], type, attributes)
  ) {
    endPos += $pos.parent.child(endIndex).nodeSize
    endIndex += 1
  }

  return {
    from: startPos,
    to: endPos,
  }
}
