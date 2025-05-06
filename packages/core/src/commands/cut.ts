import { TextSelection } from '@tiptap/pm/state'

import { RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    cut: {
      /**
       * 从范围剪切内容并插入到给定位置。
       * @param range 要剪切的内容范围。
       * @param range.from 范围的开始位置。
       * @param range.to 范围的结束位置。
       * @param targetPos 要插入内容的位置。
       * @example editor.commands.cut({ from: 1, to: 3 }, 5)
       */
      cut: ({ from, to }: { from: number, to: number }, targetPos: number) => ReturnType,
    }
  }
}

export const cut: RawCommands['cut'] = (originRange, targetPos) => ({ editor, tr }) => {
  const { state } = editor

  const contentSlice = state.doc.slice(originRange.from, originRange.to)

  tr.deleteRange(originRange.from, originRange.to)
  const newPos = tr.mapping.map(targetPos)

  tr.insert(newPos, contentSlice.content)

  tr.setSelection(new TextSelection(tr.doc.resolve(newPos - 1)))

  return true
}
