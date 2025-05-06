import { PasteRule, PasteRuleFinder } from '../PasteRule.js'

/**
 * 构建一个粘贴规则，当匹配的文本粘贴到它时替换文本。
 * @see https://tiptap.dev/docs/editor/extensions/custom-extensions/extend-existing#paste-rules
 */
export function textPasteRule(config: {
  find: PasteRuleFinder,
  replace: string,
}) {
  return new PasteRule({
    find: config.find,
    handler: ({ state, range, match }) => {
      let insert = config.replace
      let start = range.from
      const end = range.to

      if (match[1]) {
        const offset = match[0].lastIndexOf(match[1])

        insert += match[0].slice(offset + match[1].length)
        start += offset

        const cutOff = start - end

        if (cutOff > 0) {
          insert = match[0].slice(offset - cutOff, offset) + insert
          start = end
        }
      }

      state.tr.insertText(insert, start, end)
    },
  })
}
