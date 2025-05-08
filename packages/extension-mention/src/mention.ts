import { mergeAttributes, Node } from '@tiptap/core'
import { DOMOutputSpec, Node as ProseMirrorNode } from '@tiptap/pm/model'
import { PluginKey } from '@tiptap/pm/state'
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion'

// See `addAttributes` below
export interface MentionNodeAttrs {
  /**
   * 选中的项目被提及的标识符，存储为 `data-id` 属性。
   */
  id: string | null;
  /**
   * 由编辑器渲染的显示文本，如果提供。存储为 `data-label` 属性。请参阅 `renderLabel`。
   */
  label?: string | null;
}

export type MentionOptions<SuggestionItem = any, Attrs extends Record<string, any> = MentionNodeAttrs> = {
  /**
   * 提及节点的 HTML 属性。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>

  /**
   * 一个函数来渲染提及的标签。
   * @deprecated 使用 renderText 和 renderHTML 代替
   * @param props 渲染 props
   * @returns 标签
   * @example ({ options, node }) => `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`
   */
  renderLabel?: (props: { options: MentionOptions<SuggestionItem, Attrs>; node: ProseMirrorNode }) => string

  /**
   * 一个函数来渲染提及的文本。
   * @param props 渲染 props
   * @returns 文本
   * @example ({ options, node }) => `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`
   */
  renderText: (props: { options: MentionOptions<SuggestionItem, Attrs>; node: ProseMirrorNode }) => string

  /**
   * 一个函数来渲染提及的 HTML。
   * @param props 渲染 props
   * @returns 作为 ProseMirror DOM Output Spec 的 HTML
   * @example ({ options, node }) => ['span', { 'data-type': 'mention' }, `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`]
   */
  renderHTML: (props: { options: MentionOptions<SuggestionItem, Attrs>; node: ProseMirrorNode }) => DOMOutputSpec

  /**
   * 是否使用退格键删除触发字符。
   * @default false
   */
  deleteTriggerWithBackspace: boolean

  /**
   * 建议选项。
   * @default {}
   * @example { char: '@', pluginKey: MentionPluginKey, command: ({ editor, range, props }) => { ... } }
   */
  suggestion: Omit<SuggestionOptions<SuggestionItem, Attrs>, 'editor'>
}

/**
 * 提及插件的插件键。
 * @default 'mention'
 */
export const MentionPluginKey = new PluginKey('mention')

/**
 * 此扩展允许您将提及插入到编辑器中。
 * @see https://www.tiptap.dev/api/extensions/mention
 */
export const Mention = Node.create<MentionOptions>({
  name: 'mention',

  priority: 101,

  addOptions() {
    return {
      HTMLAttributes: {},
      renderText({ options, node }) {
        return `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`
      },
      deleteTriggerWithBackspace: false,
      renderHTML({ options, node }) {
        return [
          'span',
          mergeAttributes(this.HTMLAttributes, options.HTMLAttributes),
          `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`,
        ]
      },
      suggestion: {
        char: '@',
        pluginKey: MentionPluginKey,
        command: ({ editor, range, props }) => {
          // increase range.to by one when the next node is of type "text"
          // and starts with a space character
          const nodeAfter = editor.view.state.selection.$to.nodeAfter
          const overrideSpace = nodeAfter?.text?.startsWith(' ')

          if (overrideSpace) {
            range.to += 1
          }

          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: this.name,
                attrs: props,
              },
              {
                type: 'text',
                text: ' ',
              },
            ])
            .run()

          // 从编辑器元素获取 `window` 对象的引用，以支持跨框架 JS 使用
          editor.view.dom.ownerDocument.defaultView?.getSelection()?.collapseToEnd()
        },
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from)
          const type = state.schema.nodes[this.name]
          const allow = !!$from.parent.type.contentMatch.matchType(type)

          return allow
        },
      },
    }
  },

  group: 'inline',

  inline: true,

  selectable: false,

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {}
          }

          return {
            'data-id': attributes.id,
          }
        },
      },

      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-label'),
        renderHTML: attributes => {
          if (!attributes.label) {
            return {}
          }

          return {
            'data-label': attributes.label,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    if (this.options.renderLabel !== undefined) {
      console.warn('renderLabel is deprecated use renderText and renderHTML instead')
      return [
        'span',
        mergeAttributes({ 'data-type': this.name }, this.options.HTMLAttributes, HTMLAttributes),
        this.options.renderLabel({
          options: this.options,
          node,
        }),
      ]
    }
    const mergedOptions = { ...this.options }

    mergedOptions.HTMLAttributes = mergeAttributes({ 'data-type': this.name }, this.options.HTMLAttributes, HTMLAttributes)
    const html = this.options.renderHTML({
      options: mergedOptions,
      node,
    })

    if (typeof html === 'string') {
      return [
        'span',
        mergeAttributes({ 'data-type': this.name }, this.options.HTMLAttributes, HTMLAttributes),
        html,
      ]
    }
    return html
  },

  renderText({ node }) {
    if (this.options.renderLabel !== undefined) {
      console.warn('renderLabel is deprecated use renderText and renderHTML instead')
      return this.options.renderLabel({
        options: this.options,
        node,
      })
    }
    return this.options.renderText({
      options: this.options,
      node,
    })
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () => this.editor.commands.command(({ tr, state }) => {
        let isMention = false
        const { selection } = state
        const { empty, anchor } = selection

        if (!empty) {
          return false
        }

        state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
          if (node.type.name === this.name) {
            isMention = true
            tr.insertText(
              this.options.deleteTriggerWithBackspace ? '' : this.options.suggestion.char || '',
              pos,
              pos + node.nodeSize,
            )

            return false
          }
        })

        return isMention
      }),
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
