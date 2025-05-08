import { Extension } from '@tiptap/core'
import { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export interface CharacterCountOptions {
  /**
   * 应该允许的最大字符数。默认为 `0`。
   * @default null
   * @example 180
   */
  limit: number | null | undefined
  /**
   * 用于计算大小的模式。如果设置为 `textSize`，则使用文档的 `textContent`。
   * 如果设置为 `nodeSize`，则使用文档的 `nodeSize`。
   * @default 'textSize'
   * @example 'textSize'
   */
  mode: 'textSize' | 'nodeSize'
  /**
   * 使用的文本计数器函数。默认为简单的字符计数。
   * @default (text) => text.length
   * @example (text) => [...new Intl.Segmenter().segment(text)].length
   */
  textCounter: (text: string) => number
  /**
   * 使用的单词计数器函数。默认为简单的单词计数。
   * @default (text) => text.split(' ').filter(word => word !== '').length
   * @example (text) => text.split(/\s+/).filter(word => word !== '').length
   */
  wordCounter: (text: string) => number
}

export interface CharacterCountStorage {
  /**
   * 获取当前文档的字符数。
   * @param options 字符计数的选项。（可选）
   * @param options.node 要获取字符的节点。默认为当前文档。
   * @param options.mode 用于计算大小的模式。如果设置为 `textSize`，则使用文档的 `textContent`。
   */
  characters: (options?: { node?: ProseMirrorNode; mode?: 'textSize' | 'nodeSize' }) => number

  /**
   * 获取当前文档的单词数。
   * @param options 字符计数的选项。（可选）
   * @param options.node 要获取单词的节点。默认为当前文档。
   */
  words: (options?: { node?: ProseMirrorNode }) => number
}

/**
 * 此扩展允许您计算文档的字符和单词。
 * @see https://tiptap.dev/api/extensions/character-count
 */
export const CharacterCount = Extension.create<CharacterCountOptions, CharacterCountStorage>({
  name: 'characterCount',

  addOptions() {
    return {
      limit: null,
      mode: 'textSize',
      textCounter: text => text.length,
      wordCounter: text => text.split(' ').filter(word => word !== '').length,
    }
  },

  addStorage() {
    return {
      characters: () => 0,
      words: () => 0,
    }
  },

  onBeforeCreate() {
    this.storage.characters = options => {
      const node = options?.node || this.editor.state.doc
      const mode = options?.mode || this.options.mode

      if (mode === 'textSize') {
        const text = node.textBetween(0, node.content.size, undefined, ' ')

        return this.options.textCounter(text)
      }

      return node.nodeSize
    }

    this.storage.words = options => {
      const node = options?.node || this.editor.state.doc
      const text = node.textBetween(0, node.content.size, ' ', ' ')

      return this.options.wordCounter(text)
    }
  },

  addProseMirrorPlugins() {
    let initialEvaluationDone = false

    return [
      new Plugin({
        key: new PluginKey('characterCount'),
        appendTransaction: (transactions, oldState, newState) => {
          if (initialEvaluationDone) {
            return
          }

          const limit = this.options.limit

          if (limit === null || limit === undefined || limit === 0) {
            initialEvaluationDone = true
            return
          }

          const initialContentSize = this.storage.characters({ node: newState.doc })

          if (initialContentSize > limit) {
            const over = initialContentSize - limit
            const from = 0
            const to = over

            console.warn(`[CharacterCount] Initial content exceeded limit of ${limit} characters. Content was automatically trimmed.`)
            const tr = newState.tr.deleteRange(from, to)

            initialEvaluationDone = true
            return tr
          }

          initialEvaluationDone = true
        },
        filterTransaction: (transaction, state) => {
          const limit = this.options.limit

          // 没有变化或没有限制。忽略它。
          if (!transaction.docChanged || limit === 0 || limit === null || limit === undefined) {
            return true
          }

          const oldSize = this.storage.characters({ node: state.doc })
          const newSize = this.storage.characters({ node: transaction.doc })

          // 一切都在限制之内。很好。
          if (newSize <= limit) {
            return true
          }

          // 限制已经超出，但将被减少。
          if (oldSize > limit && newSize > limit && newSize <= oldSize) {
            return true
          }

          // 限制已经超出，并且将被进一步增加。
          if (oldSize > limit && newSize > limit && newSize > oldSize) {
            return false
          }

          const isPaste = transaction.getMeta('paste')

          // 阻止所有未粘贴的超出限制的事务。
          if (!isPaste) {
            return false
          }

          // 对于粘贴的内容，我们尝试删除超出限制的内容。
          const pos = transaction.selection.$head.pos
          const over = newSize - limit
          const from = pos - over
          const to = pos

          // 在 `filterTransaction` 中修改事务可能不是一个好主意，
          // 但目前这工作得很好。
          transaction.deleteRange(from, to)

          // 在某些情况下，在修剪后限制将继续超出。
          // 例如，当在复杂节点（例如表格）中截断时，
          // 并且 ProseMirror 必须再次关闭此节点。
          // 如果是这种情况，我们完全阻止事务。
          const updatedSize = this.storage.characters({ node: transaction.doc })

          if (updatedSize > limit) {
            return false
          }

          return true
        },
      }),
    ]
  },
})
