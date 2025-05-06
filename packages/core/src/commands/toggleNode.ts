import { NodeType } from '@tiptap/pm/model'

import { getNodeType } from '../helpers/getNodeType.js'
import { isNodeActive } from '../helpers/isNodeActive.js'
import { RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    toggleNode: {
      /**
       * 切换一个节点与另一个节点。
       * @param typeOrName 节点的类型或名称。
       * @param toggleTypeOrName 要切换的节点的类型或名称。
       * @param attributes 节点的属性。
       * @example editor.commands.toggleNode('heading', 'paragraph')
       */
      toggleNode: (
        typeOrName: string | NodeType,
        toggleTypeOrName: string | NodeType,
        attributes?: Record<string, any>,
      ) => ReturnType
    }
  }
}

export const toggleNode: RawCommands['toggleNode'] = (typeOrName, toggleTypeOrName, attributes = {}) => ({ state, commands }) => {
  const type = getNodeType(typeOrName, state.schema)
  const toggleType = getNodeType(toggleTypeOrName, state.schema)
  const isActive = isNodeActive(state, type, attributes)

  let attributesToCopy: Record<string, any> | undefined

  if (state.selection.$anchor.sameParent(state.selection.$head)) {
    // 仅在选择器指向相同类型的节点时复制属性
    attributesToCopy = state.selection.$anchor.parent.attrs
  }

  if (isActive) {
    return commands.setNode(toggleType, attributesToCopy)
  }

  // 如果节点不活动，我们想用给定的属性设置新节点类型
  // 复制当前节点的属性，如果选择器指向相同类型的节点
  return commands.setNode(type, { ...attributesToCopy, ...attributes })
}
