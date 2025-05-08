import { Editor, Range } from '@tiptap/core'
import { EditorState, Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet, EditorView } from '@tiptap/pm/view'

import { findSuggestionMatch as defaultFindSuggestionMatch } from './findSuggestionMatch.js'

export interface SuggestionOptions<I = any, TSelected = any> {
  /**
   * 建议插件的插件键。
   * @default 'suggestion'
   * @example 'mention'
   */
  pluginKey?: PluginKey

  /**
   * 编辑器实例。
   * @default null
   */
  editor: Editor

  /**
   * 触发建议的字符。
   * @default '@'
   * @example '#'
   */
  char?: string

  /**
   * 允许在建议查询中使用空格。不兼容 `allowToIncludeChar`。如果 `allowToIncludeChar` 设置为 `true`，则将禁用。
   * @default false
   * @example true
  */
  allowSpaces?: boolean

  /**
   * 允许字符包含在建议查询中。不兼容 `allowSpaces`。
   * @default false
   */
  allowToIncludeChar?: boolean

  /**
   * 允许在建议查询中使用前缀。
   * @default [' ']
   * @example [' ', '@']
   */
  allowedPrefixes?: string[] | null

  /**
   * 仅在行首匹配建议。
   * @default false
   * @example true
   */
  startOfLine?: boolean

  /**
   * 装饰节点的标签名称。
   * @default 'span'
   * @example 'div'
   */
  decorationTag?: string

  /**
   * 装饰节点的类名。
   * @default 'suggestion'
   * @example 'mention'
   */
  decorationClass?: string

  /**
   * 一个函数，当建议被选中时被调用。
   * @param props 属性对象。
   * @param props.editor 编辑器实例。
   * @param props.range 建议的范围。
   * @param props.props 选中的建议的属性。
   * @returns void
   * @example ({ editor, range, props }) => { props.command(props.props) }
   */
  command?: (props: { editor: Editor; range: Range; props: TSelected }) => void

  /**
   * 一个函数，返回一个包含建议项的数组。
   * @param props 属性对象。
   * @param props.editor 编辑器实例。
   * @param props.query 当前建议查询。
   * @returns 建议项的数组。
   * @example ({ editor, query }) => [{ id: 1, label: 'John Doe' }]
   */
  items?: (props: { query: string; editor: Editor }) => I[] | Promise<I[]>

  /**
   * 建议的渲染函数。
   * @returns 一个包含渲染函数的对象。
   */
  render?: () => {
    onBeforeStart?: (props: SuggestionProps<I, TSelected>) => void;
    onStart?: (props: SuggestionProps<I, TSelected>) => void;
    onBeforeUpdate?: (props: SuggestionProps<I, TSelected>) => void;
    onUpdate?: (props: SuggestionProps<I, TSelected>) => void;
    onExit?: (props: SuggestionProps<I, TSelected>) => void;
    onKeyDown?: (props: SuggestionKeyDownProps) => boolean;
  }

  /**
   * 一个函数，返回一个布尔值以指示是否应激活建议。
   * @param props 属性对象。
   * @returns {boolean}
   */
  allow?: (props: { editor: Editor; state: EditorState; range: Range, isActive?: boolean }) => boolean
  findSuggestionMatch?: typeof defaultFindSuggestionMatch
}

export interface SuggestionProps<I = any, TSelected = any> {
  /**
   * 编辑器实例。
   */
  editor: Editor

  /**
   * 建议的范围。
   */
  range: Range

  /**
   * 当前建议查询。
   */
  query: string

  /**
   * 当前建议文本。
   */
  text: string

  /**
   * 建议项的数组。
   */
  items: I[]

  /**
   * 一个函数，当建议被选中时被调用。
   * @param props 属性对象。
   * @returns void
   */
  command: (props: TSelected) => void

  /**
   * 装饰节点的 HTML 元素。
   * @default null
   */
  decorationNode: Element | null

  /**
   * 一个函数，返回一个包含客户端矩形的对象。
   * @default null
   * @example () => new DOMRect(0, 0, 0, 0)
   */
  clientRect?: (() => DOMRect | null) | null
}

export interface SuggestionKeyDownProps {
  view: EditorView
  event: KeyboardEvent
  range: Range
}

export const SuggestionPluginKey = new PluginKey('suggestion')

/**
 * 此实用程序允许您创建建议。
 * @see https://tiptap.dev/api/utilities/suggestion
 */
export function Suggestion<I = any, TSelected = any>({
  pluginKey = SuggestionPluginKey,
  editor,
  char = '@',
  allowSpaces = false,
  allowToIncludeChar = false,
  allowedPrefixes = [' '],
  startOfLine = false,
  decorationTag = 'span',
  decorationClass = 'suggestion',
  command = () => null,
  items = () => [],
  render = () => ({}),
  allow = () => true,
  findSuggestionMatch = defaultFindSuggestionMatch,
}: SuggestionOptions<I, TSelected>) {
  let props: SuggestionProps<I, TSelected> | undefined
  const renderer = render?.()

  const plugin: Plugin<any> = new Plugin({
    key: pluginKey,

    view() {
      return {
        update: async (view, prevState) => {
          const prev = this.key?.getState(prevState)
          const next = this.key?.getState(view.state)

          // 查看状态如何变化
          const moved = prev.active && next.active && prev.range.from !== next.range.from
          const started = !prev.active && next.active
          const stopped = prev.active && !next.active
          const changed = !started && !stopped && prev.query !== next.query

          const handleStart = started || (moved && changed)
          const handleChange = changed || moved
          const handleExit = stopped || (moved && changed)

          // 当建议不活跃时取消
          if (!handleStart && !handleChange && !handleExit) {
            return
          }

          const state = handleExit && !handleStart ? prev : next
          const decorationNode = view.dom.querySelector(
            `[data-decoration-id="${state.decorationId}"]`,
          )

          props = {
            editor,
            range: state.range,
            query: state.query,
            text: state.text,
            items: [],
            command: commandProps => {
              return command({
                editor,
                range: state.range,
                props: commandProps,
              })
            },
            decorationNode,
            // 虚拟节点用于 popper.js 或 tippy.js
            // 这可以用于在不使用 DOM 节点的情况下构建弹出窗口
            clientRect: decorationNode
              ? () => {
                // 因为 `items` 可以是异步的，我们将搜索当前的装饰节点
                const { decorationId } = this.key?.getState(editor.state) // eslint-disable-line
                const currentDecorationNode = view.dom.querySelector(
                  `[data-decoration-id="${decorationId}"]`,
                )

                return currentDecorationNode?.getBoundingClientRect() || null
              }
              : null,
          }

          if (handleStart) {
            renderer?.onBeforeStart?.(props)
          }

          if (handleChange) {
            renderer?.onBeforeUpdate?.(props)
          }

          if (handleChange || handleStart) {
            props.items = await items({
              editor,
              query: state.query,
            })
          }

          if (handleExit) {
            renderer?.onExit?.(props)
          }

          if (handleChange) {
            renderer?.onUpdate?.(props)
          }

          if (handleStart) {
            renderer?.onStart?.(props)
          }
        },

        destroy: () => {
          if (!props) {
            return
          }

          renderer?.onExit?.(props)
        },
      }
    },

    state: {
      // 初始化插件的内部状态。
      init() {
        const state: {
          active: boolean
          range: Range
          query: null | string
          text: null | string
          composing: boolean
          decorationId?: string | null
        } = {
          active: false,
          range: {
            from: 0,
            to: 0,
          },
          query: null,
          text: null,
          composing: false,
        }

        return state
      },

      // 从视图事务应用插件状态的变化。
      apply(transaction, prev, _oldState, state) {
        const { isEditable } = editor
        const { composing } = editor.view
        const { selection } = transaction
        const { empty, from } = selection
        const next = { ...prev }

        next.composing = composing

        // 只有在视图可编辑时才能建议，并且：
        //   * 没有选择，或者
        //   * 一个组合正在活动（见：https://github.com/ueberdosis/tiptap/issues/1449）
        if (isEditable && (empty || editor.view.composing)) {
          // 如果我们刚刚离开之前的建议范围，重置活动状态
          if ((from < prev.range.from || from > prev.range.to) && !composing && !prev.composing) {
            next.active = false
          }

          // 尝试匹配我们当前光标所在的位置
          const match = findSuggestionMatch({
            char,
            allowSpaces,
            allowToIncludeChar,
            allowedPrefixes,
            startOfLine,
            $position: selection.$from,
          })
          const decorationId = `id_${Math.floor(Math.random() * 0xffffffff)}`

          // 如果我们找到一个匹配，更新当前状态以显示它
          if (match && allow({
            editor, state, range: match.range, isActive: prev.active,
          })) {
            next.active = true
            next.decorationId = prev.decorationId ? prev.decorationId : decorationId
            next.range = match.range
            next.query = match.query
            next.text = match.text
          } else {
            next.active = false
          }
        } else {
          next.active = false
        }

        // 确保在建议不活跃时清空范围
        if (!next.active) {
          next.decorationId = null
          next.range = { from: 0, to: 0 }
          next.query = null
          next.text = null
        }

        return next
      },
    },

    props: {
      // 如果建议处于活动状态，则调用 keydown 钩子。
      handleKeyDown(view, event) {
        const { active, range } = plugin.getState(view.state)

        if (!active) {
          return false
        }

        return renderer?.onKeyDown?.({ view, event, range }) || false
      },

      // 在当前活动的建议上设置装饰器。
      decorations(state) {
        const { active, range, decorationId } = plugin.getState(state)

        if (!active) {
          return null
        }

        return DecorationSet.create(state.doc, [
          Decoration.inline(range.from, range.to, {
            nodeName: decorationTag,
            class: decorationClass,
            'data-decoration-id': decorationId,
          }),
        ])
      },
    },
  })

  return plugin
}
