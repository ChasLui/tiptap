import { mergeAttributes, Node, textblockTypeInputRule } from '@tiptap/core'
import {
  Plugin,
  PluginKey,
  Selection,
  TextSelection,
} from '@tiptap/pm/state'

export interface CodeBlockOptions {
  /**
   * 添加一个前缀到应用于代码标签的语言类。
   * @default 'language-'
   */
  languageClassPrefix: string
  /**
   * 定义是否在三重 Enter 时退出节点。
   * @default true
   */
  exitOnTripleEnter: boolean
  /**
   * 定义是否在箭头向下时退出节点（如果后面没有节点）。
   * @default true
   */
  exitOnArrowDown: boolean
  /**
   * 默认语言。
   * @default null
   * @example 'js'
   */
  defaultLanguage: string | null | undefined
  /**
   * 应该添加到渲染的 HTML 标签中的自定义 HTML 属性。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    codeBlock: {
      /**
       * 设置一个代码块
       * @param attributes 代码块属性
       * @example editor.commands.setCodeBlock({ language: 'javascript' })
       */
      setCodeBlock: (attributes?: { language: string }) => ReturnType
      /**
       * 切换一个代码块
       * @param attributes 代码块属性
       * @example editor.commands.toggleCodeBlock({ language: 'javascript' })
       */
      toggleCodeBlock: (attributes?: { language: string }) => ReturnType
    }
  }
}

/**
 * 匹配一个带有反引号的代码块。
 */
export const backtickInputRegex = /^```([a-z]+)?[\s\n]$/

/**
 * 匹配一个带有波浪号的代码块。
 */
export const tildeInputRegex = /^~~~([a-z]+)?[\s\n]$/

/**
 * 此扩展允许您创建代码块。
 * @see https://tiptap.dev/api/nodes/code-block
 */
export const CodeBlock = Node.create<CodeBlockOptions>({
  name: 'codeBlock',

  addOptions() {
    return {
      languageClassPrefix: 'language-',
      exitOnTripleEnter: true,
      exitOnArrowDown: true,
      defaultLanguage: null,
      HTMLAttributes: {},
    }
  },

  content: 'text*',

  marks: '',

  group: 'block',

  code: true,

  defining: true,

  addAttributes() {
    return {
      language: {
        default: this.options.defaultLanguage,
        parseHTML: element => {
          const { languageClassPrefix } = this.options
          const classNames = [...(element.firstElementChild?.classList || [])]
          const languages = classNames
            .filter(className => className.startsWith(languageClassPrefix))
            .map(className => className.replace(languageClassPrefix, ''))
          const language = languages[0]

          if (!language) {
            return null
          }

          return language
        },
        rendered: false,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'pre',
        preserveWhitespace: 'full',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'pre',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      [
        'code',
        {
          class: node.attrs.language
            ? this.options.languageClassPrefix + node.attrs.language
            : null,
        },
        0,
      ],
    ]
  },

  addCommands() {
    return {
      setCodeBlock:
        attributes => ({ commands }) => {
          return commands.setNode(this.name, attributes)
        },
      toggleCodeBlock:
        attributes => ({ commands }) => {
          return commands.toggleNode(this.name, 'paragraph', attributes)
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-c': () => this.editor.commands.toggleCodeBlock(),

      // 当在文档开头或代码块为空时删除代码块
      Backspace: () => {
        const { empty, $anchor } = this.editor.state.selection
        const isAtStart = $anchor.pos === 1

        if (!empty || $anchor.parent.type.name !== this.name) {
          return false
        }

        if (isAtStart || !$anchor.parent.textContent.length) {
          return this.editor.commands.clearNodes()
        }

        return false
      },

      // 当在文档开头或代码块为空时删除代码块
      Enter: ({ editor }) => {
        if (!this.options.exitOnTripleEnter) {
          return false
        }

        const { state } = editor
        const { selection } = state
        const { $from, empty } = selection

        if (!empty || $from.parent.type !== this.type) {
          return false
        }

        const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2
        const endsWithDoubleNewline = $from.parent.textContent.endsWith('\n\n')

        if (!isAtEnd || !endsWithDoubleNewline) {
          return false
        }

        return editor
          .chain()
          .command(({ tr }) => {
            tr.delete($from.pos - 2, $from.pos)

            return true
          })
          .exitCode()
          .run()
      },

      // 当箭头向下时退出节点
      ArrowDown: ({ editor }) => {
        if (!this.options.exitOnArrowDown) {
          return false
        }

        const { state } = editor
        const { selection, doc } = state
        const { $from, empty } = selection

        if (!empty || $from.parent.type !== this.type) {
          return false
        }

        const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2

        if (!isAtEnd) {
          return false
        }

        const after = $from.after()

        if (after === undefined) {
          return false
        }

        const nodeAfter = doc.nodeAt(after)

        if (nodeAfter) {
          return editor.commands.command(({ tr }) => {
            tr.setSelection(Selection.near(doc.resolve(after)))
            return true
          })
        }

        return editor.commands.exitCode()
      },
    }
  },

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: backtickInputRegex,
        type: this.type,
        getAttributes: match => ({
          language: match[1],
        }),
      }),
      textblockTypeInputRule({
        find: tildeInputRegex,
        type: this.type,
        getAttributes: match => ({
          language: match[1],
        }),
      }),
    ]
  },

  addProseMirrorPlugins() {
    return [
      // 此插件为从 VS Code 粘贴的内容创建一个代码块
      // 我们还可以检测复制的代码语言
      new Plugin({
        key: new PluginKey('codeBlockVSCodeHandler'),
        props: {
          handlePaste: (view, event) => {
            if (!event.clipboardData) {
              return false
            }

            // 不要在代码块内创建新的代码块
            if (this.editor.isActive(this.type.name)) {
              return false
            }

            const text = event.clipboardData.getData('text/plain')
            const vscode = event.clipboardData.getData('vscode-editor-data')
            const vscodeData = vscode ? JSON.parse(vscode) : undefined
            const language = vscodeData?.mode

            if (!text || !language) {
              return false
            }

            const { tr, schema } = view.state

            // 准备一个文本节点
            // 从粘贴的代码中删除回车字符
            // 参见：https://github.com/ProseMirror/prosemirror-view/commit/a50a6bcceb4ce52ac8fcc6162488d8875613aacd
            const textNode = schema.text(text.replace(/\r\n?/g, '\n'))

            // 用文本节点创建一个代码块
            // 替换选择与代码块
            tr.replaceSelectionWith(this.type.create({ language }, textNode))

            if (tr.selection.$from.parent.type !== this.type) {
              // 将光标放在新创建的代码块中
              tr.setSelection(TextSelection.near(tr.doc.resolve(Math.max(0, tr.selection.from - 2))))
            }

            // 存储元信息
            // 这对于依赖粘贴事件的其他插件很有用
            // 如粘贴规则插件
            tr.setMeta('paste', true)

            view.dispatch(tr)

            return true
          },
        },
      }),
    ]
  },
})
