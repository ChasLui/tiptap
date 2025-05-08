import { findChildren } from '@tiptap/core'
import { Node as ProsemirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
// @ts-ignore
import highlight from 'highlight.js/lib/core'

function parseNodes(nodes: any[], className: string[] = []): { text: string; classes: string[] }[] {
  return nodes
    .map(node => {
      const classes = [...className, ...(node.properties ? node.properties.className : [])]

      if (node.children) {
        return parseNodes(node.children, classes)
      }

      return {
        text: node.value,
        classes,
      }
    })
    .flat()
}

function getHighlightNodes(result: any) {
  // `.value` for lowlight v1, `.children` for lowlight v2
  return result.value || result.children || []
}

function registered(aliasOrLanguage: string) {
  return Boolean(highlight.getLanguage(aliasOrLanguage))
}

function getDecorations({
  doc,
  name,
  lowlight,
  defaultLanguage,
}: {
  doc: ProsemirrorNode
  name: string
  lowlight: any
  defaultLanguage: string | null | undefined
}) {
  const decorations: Decoration[] = []

  findChildren(doc, node => node.type.name === name).forEach(block => {
    let from = block.pos + 1
    const language = block.node.attrs.language || defaultLanguage
    const languages = lowlight.listLanguages()

    const nodes = language && (languages.includes(language) || registered(language) || lowlight.registered?.(language))
      ? getHighlightNodes(lowlight.highlight(language, block.node.textContent))
      : getHighlightNodes(lowlight.highlightAuto(block.node.textContent))

    parseNodes(nodes).forEach(node => {
      const to = from + node.text.length

      if (node.classes.length) {
        const decoration = Decoration.inline(from, to, {
          class: node.classes.join(' '),
        })

        decorations.push(decoration)
      }

      from = to
    })
  })

  return DecorationSet.create(doc, decorations)
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function isFunction(param: any): param is Function {
  return typeof param === 'function'
}

export function LowlightPlugin({
  name,
  lowlight,
  defaultLanguage,
}: {
  name: string
  lowlight: any
  defaultLanguage: string | null | undefined
}) {
  if (!['highlight', 'highlightAuto', 'listLanguages'].every(api => isFunction(lowlight[api]))) {
    throw Error(
      'You should provide an instance of lowlight to use the code-block-lowlight extension',
    )
  }

  const lowlightPlugin: Plugin<any> = new Plugin({
    key: new PluginKey('lowlight'),

    state: {
      init: (_, { doc }) => getDecorations({
        doc,
        name,
        lowlight,
        defaultLanguage,
      }),
      apply: (transaction, decorationSet, oldState, newState) => {
        const oldNodeName = oldState.selection.$head.parent.type.name
        const newNodeName = newState.selection.$head.parent.type.name
        const oldNodes = findChildren(oldState.doc, node => node.type.name === name)
        const newNodes = findChildren(newState.doc, node => node.type.name === name)

        if (
          transaction.docChanged
          // 如果：
          // 选择包括命名节点，
          && ([oldNodeName, newNodeName].includes(name)
            // OR 事务添加/删除命名节点，
            || newNodes.length !== oldNodes.length
            // OR 事务完全封装了一个节点
            // (例如，影响整个文档的事务)。
            // 这样的事务可能会在通过 y-prosemirror 进行协作同步时发生，例如。
            || transaction.steps.some(step => {
              // @ts-ignore
              return (
                // @ts-ignore
                step.from !== undefined
                // @ts-ignore
                && step.to !== undefined
                && oldNodes.some(node => {
                  // @ts-ignore
                  return (
                    // @ts-ignore
                    node.pos >= step.from
                    // @ts-ignore
                    && node.pos + node.node.nodeSize <= step.to
                  )
                })
              )
            }))
        ) {
          return getDecorations({
            doc: transaction.doc,
            name,
            lowlight,
            defaultLanguage,
          })
        }

        return decorationSet.map(transaction.mapping, transaction.doc)
      },
    },

    props: {
      decorations(state) {
        return lowlightPlugin.getState(state)
      },
    },
  })

  return lowlightPlugin
}
