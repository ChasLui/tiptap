import { Step, Transform } from '@tiptap/pm/transform'

import { Range } from '../types.js'
import { removeDuplicates } from '../utilities/removeDuplicates.js'

export type ChangedRange = {
  oldRange: Range,
  newRange: Range,
}

/**
 * 删除重复的范围和完全被其他范围捕获的范围。
 */
function simplifyChangedRanges(changes: ChangedRange[]): ChangedRange[] {
  const uniqueChanges = removeDuplicates(changes)

  return uniqueChanges.length === 1
    ? uniqueChanges
    : uniqueChanges.filter((change, index) => {
      const rest = uniqueChanges.filter((_, i) => i !== index)

      return !rest.some(otherChange => {
        return change.oldRange.from >= otherChange.oldRange.from
          && change.oldRange.to <= otherChange.oldRange.to
          && change.newRange.from >= otherChange.newRange.from
          && change.newRange.to <= otherChange.newRange.to
      })
    })
}

/**
 * 基于所有步骤的第一个和最后一个状态返回一个更改范围列表。
 */
export function getChangedRanges(transform: Transform): ChangedRange[] {
  const { mapping, steps } = transform
  const changes: ChangedRange[] = []

  mapping.maps.forEach((stepMap, index) => {
    const ranges: Range[] = []

    // 这考虑了步骤更改，其中没有实际更改范围
    // 例如，当设置标记、节点属性等时。
    // @ts-ignore
    if (!stepMap.ranges.length) {
      const { from, to } = steps[index] as Step & {
        from?: number,
        to?: number,
      }

      if (from === undefined || to === undefined) {
        return
      }

      ranges.push({ from, to })
    } else {
      stepMap.forEach((from, to) => {
        ranges.push({ from, to })
      })
    }

    ranges.forEach(({ from, to }) => {
      const newStart = mapping.slice(index).map(from, -1)
      const newEnd = mapping.slice(index).map(to)
      const oldStart = mapping.invert().map(newStart, -1)
      const oldEnd = mapping.invert().map(newEnd)

      changes.push({
        oldRange: {
          from: oldStart,
          to: oldEnd,
        },
        newRange: {
          from: newStart,
          to: newEnd,
        },
      })
    })
  })

  return simplifyChangedRanges(changes)
}
