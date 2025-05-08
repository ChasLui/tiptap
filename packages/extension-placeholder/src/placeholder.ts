import { Editor, Extension, isNodeEmpty } from '@tiptap/core'
import { Node as ProsemirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface PlaceholderOptions {
  /**
   * **用于空编辑器的类名**
   * @default 'is-editor-empty'
   */
  emptyEditorClass: string

  /**
   * **用于空节点的类名**
   * @default 'is-empty'
   */
  emptyNodeClass: string

  /**
   * **占位符内容**
   *
   * 您可以使用函数返回动态占位符或字符串。
   * @default 'Write something …'
   */
  placeholder:
    | ((PlaceholderProps: {
        editor: Editor
        node: ProsemirrorNode
        pos: number
        hasAnchor: boolean
      }) => string)
    | string

  /**
   * 请参阅 https://github.com/ueberdosis/tiptap/pull/5278 了解更多信息。
   * @deprecated 此选项不再受尊重，此类型将在下一个主要版本中删除。
   */
  considerAnyAsEmpty?: boolean

  /**
   * **检查占位符是否仅在编辑器可编辑时显示。**
   *
   * 如果为 true，则占位符仅在编辑器可编辑时显示。
   * 如果为 false，则占位符始终显示。
   * @default true
   */
  showOnlyWhenEditable: boolean

  /**
   * **检查占位符是否仅在当前节点为空时显示。**
   *
   * 如果为 true，则占位符仅在当前节点为空时显示。
   * 如果为 false，则占位符在任何节点为空时显示。
   * @default true
   */
  showOnlyCurrent: boolean

  /**
   * **控制是否为所有后代显示占位符。**
   *
   * 如果为 true，则占位符将为所有后代显示。
   * 如果为 false，则占位符仅显示当前节点。
   * @default false
   */
  includeChildren: boolean
}

/**
 * 此扩展允许您向编辑器添加占位符。
 * 占位符是当编辑器或节点为空时出现的文本。
 * @see https://www.tiptap.dev/api/extensions/placeholder
 */
export const Placeholder = Extension.create<PlaceholderOptions>({
  name: 'placeholder',

  addOptions() {
    return {
      emptyEditorClass: 'is-editor-empty',
      emptyNodeClass: 'is-empty',
      placeholder: 'Write something …',
      showOnlyWhenEditable: true,
      showOnlyCurrent: true,
      includeChildren: false,
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('placeholder'),
        props: {
          decorations: ({ doc, selection }) => {
            const active = this.editor.isEditable || !this.options.showOnlyWhenEditable
            const { anchor } = selection
            const decorations: Decoration[] = []

            if (!active) {
              return null
            }

            const isEmptyDoc = this.editor.isEmpty

            doc.descendants((node, pos) => {
              const hasAnchor = anchor >= pos && anchor <= pos + node.nodeSize
              const isEmpty = !node.isLeaf && isNodeEmpty(node)

              if ((hasAnchor || !this.options.showOnlyCurrent) && isEmpty) {
                const classes = [this.options.emptyNodeClass]

                if (isEmptyDoc) {
                  classes.push(this.options.emptyEditorClass)
                }

                const decoration = Decoration.node(pos, pos + node.nodeSize, {
                  class: classes.join(' '),
                  'data-placeholder':
                    typeof this.options.placeholder === 'function'
                      ? this.options.placeholder({
                        editor: this.editor,
                        node,
                        pos,
                        hasAnchor,
                      })
                      : this.options.placeholder,
                })

                decorations.push(decoration)
              }

              return this.options.includeChildren
            })

            return DecorationSet.create(doc, decorations)
          },
        },
      }),
    ]
  },
})
