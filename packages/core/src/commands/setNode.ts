import { setBlockType } from '@tiptap/pm/commands'
import { NodeType } from '@tiptap/pm/model'

import { getNodeType } from '../helpers/getNodeType.js'
import { RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    setNode: {
      /**
       * 用一个节点替换给定的范围。
       * @param typeOrName 节点的类型或名称。
       * @param attributes 节点的属性。
       * @example editor.commands.setNode('paragraph')
       */
      setNode: (typeOrName: string | NodeType, attributes?: Record<string, any>) => ReturnType
    }
  }
}

export const setNode: RawCommands['setNode'] = (typeOrName, attributes = {}) => ({ state, dispatch, chain }) => {
  const type = getNodeType(typeOrName, state.schema)

  let attributesToCopy: Record<string, any> | undefined

  if (state.selection.$anchor.sameParent(state.selection.$head)) {
    // 仅在选择器指向相同类型的节点时复制属性
    attributesToCopy = state.selection.$anchor.parent.attrs
  }

  // TODO：使用像插入符号的回退？
  if (!type.isTextblock) {
    console.warn('[tiptap warn]: 目前 "setNode()" 仅支持文本块节点。')

    return false
  }

  return (
    chain()
      // 如果需要，尝试将节点转换为默认节点
      .command(({ commands }) => {
        const canSetBlock = setBlockType(type, { ...attributesToCopy, ...attributes })(state)

        if (canSetBlock) {
          return true
        }

        return commands.clearNodes()
      })
      .command(({ state: updatedState }) => {
        return setBlockType(type, { ...attributesToCopy, ...attributes })(updatedState, dispatch)
      })
      .run()
  )
}
