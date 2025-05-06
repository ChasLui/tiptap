import { Fragment, Node as ProseMirrorNode, ParseOptions } from '@tiptap/pm/model'

import { createDocument } from '../helpers/createDocument.js'
import { Content, RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    setContent: {
      /**
       * 用新内容替换整个文档。
       * @param content 新内容。
       * @param emitUpdate 是否发出更新事件。
       * @param parseOptions 解析内容的选项。
       * @example editor.commands.setContent('<p>Example text</p>')
       */
      setContent: (
        /**
         * 新内容。
         */
        content: Content | Fragment | ProseMirrorNode,

        /**
         * 是否发出更新事件。
         * @default false
         */
        emitUpdate?: boolean,

        /**
         * 解析内容的选项。
         * @default {}
         */
        parseOptions?: ParseOptions,

        /**
         * `setContent` 的选项。
         */
        options?: {
          /**
           * 如果内容无效，是否抛出错误。
           */
          errorOnInvalidContent?: boolean;
        }
      ) => ReturnType;
    };
  }
}

export const setContent: RawCommands['setContent'] = (content, emitUpdate = false, parseOptions = {}, options = {}) => ({
  editor, tr, dispatch, commands,
}) => {
  const { doc } = tr

  // 这是为了保持与以前行为的向后兼容性
  // TODO 在下一个主要版本中删除此代码
  if (parseOptions.preserveWhitespace !== 'full') {
    const document = createDocument(content, editor.schema, parseOptions, {
      errorOnInvalidContent: options.errorOnInvalidContent ?? editor.options.enableContentCheck,
    })

    if (dispatch) {
      tr.replaceWith(0, doc.content.size, document).setMeta('preventUpdate', !emitUpdate)
    }
    return true
  }

  if (dispatch) {
    tr.setMeta('preventUpdate', !emitUpdate)
  }

  return commands.insertContentAt({ from: 0, to: doc.content.size }, content, {
    parseOptions,
    errorOnInvalidContent: options.errorOnInvalidContent ?? editor.options.enableContentCheck,
  })
}
