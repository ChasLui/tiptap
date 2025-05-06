import { Fragment, Node as ProseMirrorNode } from '@tiptap/pm/model'
import { EditorState, Plugin, TextSelection } from '@tiptap/pm/state'

import { CommandManager } from './CommandManager.js'
import { Editor } from './Editor.js'
import { createChainableState } from './helpers/createChainableState.js'
import { getHTMLFromFragment } from './helpers/getHTMLFromFragment.js'
import { getTextContentFromNodes } from './helpers/getTextContentFromNodes.js'
import {
  CanCommands,
  ChainedCommands,
  ExtendedRegExpMatchArray,
  Range,
  SingleCommands,
} from './types.js'
import { isRegExp } from './utilities/isRegExp.js'

export type InputRuleMatch = {
  index: number;
  text: string;
  replaceWith?: string;
  match?: RegExpMatchArray;
  data?: Record<string, any>;
};

export type InputRuleFinder = RegExp | ((text: string) => InputRuleMatch | null);

export class InputRule {
  find: InputRuleFinder

  handler: (props: {
    state: EditorState;
    range: Range;
    match: ExtendedRegExpMatchArray;
    commands: SingleCommands;
    chain: () => ChainedCommands;
    can: () => CanCommands;
  }) => void | null

  constructor(config: {
    find: InputRuleFinder;
    handler: (props: {
      state: EditorState;
      range: Range;
      match: ExtendedRegExpMatchArray;
      commands: SingleCommands;
      chain: () => ChainedCommands;
      can: () => CanCommands;
    }) => void | null;
  }) {
    this.find = config.find
    this.handler = config.handler
  }
}

const inputRuleMatcherHandler = (
  text: string,
  find: InputRuleFinder,
): ExtendedRegExpMatchArray | null => {
  if (isRegExp(find)) {
    return find.exec(text)
  }

  const inputRuleMatch = find(text)

  if (!inputRuleMatch) {
    return null
  }

  const result: ExtendedRegExpMatchArray = [inputRuleMatch.text]

  result.index = inputRuleMatch.index
  result.input = text
  result.data = inputRuleMatch.data

  if (inputRuleMatch.replaceWith) {
    if (!inputRuleMatch.text.includes(inputRuleMatch.replaceWith)) {
      console.warn(
        '[tiptap warn]: "inputRuleMatch.replaceWith" must be part of "inputRuleMatch.text".',
      )
    }

    result.push(inputRuleMatch.replaceWith)
  }

  return result
}

function run(config: {
  editor: Editor;
  from: number;
  to: number;
  text: string;
  rules: InputRule[];
  plugin: Plugin;
}): boolean {
  const {
    editor, from, to, text, rules, plugin,
  } = config
  const { view } = editor

  if (view.composing) {
    return false
  }

  const $from = view.state.doc.resolve(from)

  if (
    // 检查代码节点
    $from.parent.type.spec.code
    // 检查代码标记
    || !!($from.nodeBefore || $from.nodeAfter)?.marks.find(mark => mark.type.spec.code)
  ) {
    return false
  }

  let matched = false

  const textBefore = getTextContentFromNodes($from) + text

  rules.forEach(rule => {
    if (matched) {
      return
    }

    const match = inputRuleMatcherHandler(textBefore, rule.find)

    if (!match) {
      return
    }

    const tr = view.state.tr
    const state = createChainableState({
      state: view.state,
      transaction: tr,
    })
    const range = {
      from: from - (match[0].length - text.length),
      to,
    }

    const { commands, chain, can } = new CommandManager({
      editor,
      state,
    })

    const handler = rule.handler({
      state,
      range,
      match,
      commands,
      chain,
      can,
    })

    // 如果没有更改，则停止
    if (handler === null || !tr.steps.length) {
      return
    }

    // 将转换存储为元数据
    // 以便我们可以在 `undoInputRules` 命令中撤消输入规则
    tr.setMeta(plugin, {
      transform: tr,
      from,
      to,
      text,
    })

    view.dispatch(tr)
    matched = true
  })

  return matched
}

/**
 * 创建一个输入规则插件。当启用时，它将导致输入的文本
 * 匹配任何给定的规则时触发规则的操作。
 */
export function inputRulesPlugin(props: { editor: Editor; rules: InputRule[] }): Plugin {
  const { editor, rules } = props
  const plugin = new Plugin({
    state: {
      init() {
        return null
      },
      apply(tr, prev, state) {
        const stored = tr.getMeta(plugin)

        if (stored) {
          return stored
        }

        // 如果 InputRule 由 insertContent() 触发
        const simulatedInputMeta = tr.getMeta('applyInputRules') as
          | undefined
          | {
              from: number;
              text: string | ProseMirrorNode | Fragment;
            }
        const isSimulatedInput = !!simulatedInputMeta

        if (isSimulatedInput) {
          setTimeout(() => {
            let { text } = simulatedInputMeta

            if (typeof text === 'string') {
              text = text as string
            } else {
              text = getHTMLFromFragment(Fragment.from(text), state.schema)
            }

            const { from } = simulatedInputMeta
            const to = from + text.length

            run({
              editor,
              from,
              to,
              text,
              rules,
              plugin,
            })
          })
        }

        return tr.selectionSet || tr.docChanged ? null : prev
      },
    },

    props: {
      handleTextInput(view, from, to, text) {
        return run({
          editor,
          from,
          to,
          text,
          rules,
          plugin,
        })
      },

      handleDOMEvents: {
        compositionend: view => {
          setTimeout(() => {
            const { $cursor } = view.state.selection as TextSelection

            if ($cursor) {
              run({
                editor,
                from: $cursor.pos,
                to: $cursor.pos,
                text: '',
                rules,
                plugin,
              })
            }
          })

          return false
        },
      },

      // 添加支持在按下 Enter 时触发输入规则
      // 这对于代码块等非常有用
      handleKeyDown(view, event) {
        if (event.key !== 'Enter') {
          return false
        }

        const { $cursor } = view.state.selection as TextSelection

        if ($cursor) {
          return run({
            editor,
            from: $cursor.pos,
            to: $cursor.pos,
            text: '\n',
            rules,
            plugin,
          })
        }

        return false
      },
    },

    // @ts-ignore
    isInputRules: true,
  }) as Plugin

  return plugin
}
