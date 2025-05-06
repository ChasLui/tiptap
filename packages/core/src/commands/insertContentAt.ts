import { Fragment, Node as ProseMirrorNode, ParseOptions } from '@tiptap/pm/model'

import { createNodeFromContent } from '../helpers/createNodeFromContent.js'
import { selectionToInsertionEnd } from '../helpers/selectionToInsertionEnd.js'
import { Content, Range, RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    insertContentAt: {
      /**
       * 在特定位置插入一个节点或 HTML 字符串。
       * @example editor.commands.insertContentAt(0, '<h1>Example</h1>')
       */
      insertContentAt: (
        /**
         * 要插入内容的位置。
         */
        position: number | Range,

        /**
         * 要插入的 ProseMirror 内容。
         */
        value: Content | ProseMirrorNode | Fragment,

        /**
         * 可选选项。
         */
        options?: {
          /**
           * 解析内容的选项。
           */
          parseOptions?: ParseOptions

          /**
           * 是否在插入内容后更新选择。
           */
          updateSelection?: boolean

          /**
           * 是否在插入内容后应用输入规则。
           */
          applyInputRules?: boolean

          /**
           * 是否在插入内容后应用粘贴规则。
           */
          applyPasteRules?: boolean

          /**
           * 是否在内容无效时抛出错误。
           */
          errorOnInvalidContent?: boolean
        },
      ) => ReturnType
    }
  }
}

const isFragment = (nodeOrFragment: ProseMirrorNode | Fragment): nodeOrFragment is Fragment => {
  return !('type' in nodeOrFragment)
}

export const insertContentAt: RawCommands['insertContentAt'] = (position, value, options) => ({ tr, dispatch, editor }) => {
  if (dispatch) {
    options = {
      parseOptions: editor.options.parseOptions,
      updateSelection: true,
      applyInputRules: false,
      applyPasteRules: false,
      ...options,
    }

    let content: Fragment | ProseMirrorNode

    try {
      content = createNodeFromContent(value, editor.schema, {
        parseOptions: {
          preserveWhitespace: 'full',
          ...options.parseOptions,
        },
        errorOnInvalidContent: options.errorOnInvalidContent ?? editor.options.enableContentCheck,
      })
    } catch (e) {
      editor.emit('contentError', {
        editor,
        error: e as Error,
        disableCollaboration: () => {
          if (editor.storage.collaboration) {
            editor.storage.collaboration.isDisabled = true
          }
        },
      })
      return false
    }

    let { from, to } = typeof position === 'number' ? { from: position, to: position } : { from: position.from, to: position.to }

    let isOnlyTextContent = true
    let isOnlyBlockContent = true
    const nodes = isFragment(content) ? content : [content]

    nodes.forEach(node => {
      // check if added node is valid
      node.check()

      isOnlyTextContent = isOnlyTextContent ? node.isText && node.marks.length === 0 : false

      isOnlyBlockContent = isOnlyBlockContent ? node.isBlock : false
    })

    // check if we can replace the wrapping node by
    // the newly inserted content
    // example:
    // replace an empty paragraph by an inserted image
    // instead of inserting the image below the paragraph
    if (from === to && isOnlyBlockContent) {
      const { parent } = tr.doc.resolve(from)
      const isEmptyTextBlock = parent.isTextblock && !parent.type.spec.code && !parent.childCount

      if (isEmptyTextBlock) {
        from -= 1
        to += 1
      }
    }

    let newContent

    // if there is only plain text we have to use `insertText`
    // because this will keep the current marks
    if (isOnlyTextContent) {
      // if value is string, we can use it directly
      // otherwise if it is an array, we have to join it
      if (Array.isArray(value)) {
        newContent = value.map(v => v.text || '').join('')
      } else if (value instanceof Fragment) {
        let text = ''

        value.forEach(node => {
          if (node.text) {
            text += node.text
          }
        })

        newContent = text
      } else if (typeof value === 'object' && !!value && !!value.text) {
        newContent = value.text
      } else {
        newContent = value as string
      }

      tr.insertText(newContent, from, to)
    } else {
      newContent = content

      tr.replaceWith(from, to, newContent)
    }

    // set cursor at end of inserted content
    if (options.updateSelection) {
      selectionToInsertionEnd(tr, tr.steps.length - 1, -1)
    }

    if (options.applyInputRules) {
      tr.setMeta('applyInputRules', { from, text: newContent })
    }

    if (options.applyPasteRules) {
      tr.setMeta('applyPasteRules', { from, text: newContent })
    }
  }

  return true
}
