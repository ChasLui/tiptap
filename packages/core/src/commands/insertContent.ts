import { Fragment, Node as ProseMirrorNode, ParseOptions } from '@tiptap/pm/model'

import { Content, RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    insertContent: {
      /**
       * 在当前位置插入一个节点或 HTML 字符串。
       * @example editor.commands.insertContent('<h1>Example</h1>')
       * @example editor.commands.insertContent('<h1>Example</h1>', { updateSelection: false })
       */
      insertContent: (
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
          parseOptions?: ParseOptions;

          /**
           * 是否在插入内容后更新选择。
           */
          updateSelection?: boolean;
          applyInputRules?: boolean;
          applyPasteRules?: boolean;
        }
      ) => ReturnType;
    };
  }
}

export const insertContent: RawCommands['insertContent'] = (value, options) => ({ tr, commands }) => {
  return commands.insertContentAt(
    { from: tr.selection.from, to: tr.selection.to },
    value,
    options,
  )
}
