import { wrapIn as originalWrapIn } from '@tiptap/pm/commands'
import { NodeType } from '@tiptap/pm/model'

import { getNodeType } from '../helpers/getNodeType.js'
import { RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    wrapIn: {
      /**
       * 包裹节点在另一个节点中。
       * @param typeOrName 节点的类型或名称。
       * @param attributes 节点的属性。
       * @example editor.commands.wrapIn('blockquote')
       */
      wrapIn: (typeOrName: string | NodeType, attributes?: Record<string, any>) => ReturnType
    }
  }
}

export const wrapIn: RawCommands['wrapIn'] = (typeOrName, attributes = {}) => ({ state, dispatch }) => {
  const type = getNodeType(typeOrName, state.schema)

  return originalWrapIn(type, attributes)(state, dispatch)
}
