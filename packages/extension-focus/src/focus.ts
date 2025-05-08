import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface FocusOptions {
  /**
   * 应该添加到聚焦节点的类名。
   * @default 'has-focus'
   * @example 'is-focused'
   */
  className: string

  /**
   * 确定聚焦节点的模式。
   * - All: 所有节点都被标记为聚焦。
   * - Deepest: 只有最深的节点被标记为聚焦。
   * - Shallowest: 只有最浅的节点被标记为聚焦。
   *
   * @default 'all'
   * @example 'deepest'
   * @example 'shallowest'
   */
  mode: 'all' | 'deepest' | 'shallowest'
}

/**
 * 此扩展允许您为聚焦节点添加一个类。
 * @see https://www.tiptap.dev/api/extensions/focus
 */
export const FocusClasses = Extension.create<FocusOptions>({
  name: 'focus',

  addOptions() {
    return {
      className: 'has-focus',
      mode: 'all',
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('focus'),
        props: {
          decorations: ({ doc, selection }) => {
            const { isEditable, isFocused } = this.editor
            const { anchor } = selection
            const decorations: Decoration[] = []

            if (!isEditable || !isFocused) {
              return DecorationSet.create(doc, [])
            }

            // 最大级别
            let maxLevels = 0

            if (this.options.mode === 'deepest') {
              doc.descendants((node, pos) => {
                if (node.isText) {
                  return
                }

                const isCurrent = anchor >= pos && anchor <= pos + node.nodeSize - 1

                if (!isCurrent) {
                  return false
                }

                maxLevels += 1
              })
            }

            // 遍历当前级别
            let currentLevel = 0

            doc.descendants((node, pos) => {
              if (node.isText) {
                return false
              }

              const isCurrent = anchor >= pos && anchor <= pos + node.nodeSize - 1

              if (!isCurrent) {
                return false
              }

              currentLevel += 1

              const outOfScope = (this.options.mode === 'deepest' && maxLevels - currentLevel > 0)
                || (this.options.mode === 'shallowest' && currentLevel > 1)

              if (outOfScope) {
                return this.options.mode === 'deepest'
              }

              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  class: this.options.className,
                }),
              )
            })

            return DecorationSet.create(doc, decorations)
          },
        },
      }),
    ]
  },
})
