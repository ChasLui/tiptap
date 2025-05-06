import { NodeType } from '@tiptap/pm/model'
import { wrapInList as originalWrapInList } from '@tiptap/pm/schema-list'

import { getNodeType } from '../helpers/getNodeType.js'
import { RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    wrapInList: {
      /**
       * 包裹节点在一个列表中。
       * @param typeOrName 节点的类型或名称。
       * @param attributes 节点的属性。
       * @example editor.commands.wrapInList('bulletList')
       */
      wrapInList: (typeOrName: string | NodeType, attributes?: Record<string, any>) => ReturnType
    }
  }
}

export const wrapInList: RawCommands['wrapInList'] = (typeOrName, attributes = {}) => ({ state, dispatch }) => {
  const type = getNodeType(typeOrName, state.schema)

  return originalWrapInList(type, attributes)(state, dispatch)
}
