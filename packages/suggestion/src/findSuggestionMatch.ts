import { escapeForRegEx, Range } from '@tiptap/core'
import { ResolvedPos } from '@tiptap/pm/model'

export interface Trigger {
  char: string
  allowSpaces: boolean
  allowToIncludeChar: boolean
  allowedPrefixes: string[] | null
  startOfLine: boolean
  $position: ResolvedPos
}

export type SuggestionMatch = {
  range: Range
  query: string
  text: string
} | null

export function findSuggestionMatch(config: Trigger): SuggestionMatch {
  const {
    char, allowSpaces: allowSpacesOption, allowToIncludeChar, allowedPrefixes, startOfLine, $position,
  } = config

  const allowSpaces = allowSpacesOption && !allowToIncludeChar

  const escapedChar = escapeForRegEx(char)
  const suffix = new RegExp(`\\s${escapedChar}$`)
  const prefix = startOfLine ? '^' : ''
  const finalEscapedChar = allowToIncludeChar ? '' : escapedChar
  const regexp = allowSpaces
    ? new RegExp(`${prefix}${escapedChar}.*?(?=\\s${finalEscapedChar}|$)`, 'gm')
    : new RegExp(`${prefix}(?:^)?${escapedChar}[^\\s${finalEscapedChar}]*`, 'gm')

  const text = $position.nodeBefore?.isText && $position.nodeBefore.text

  if (!text) {
    return null
  }

  const textFrom = $position.pos - text.length
  const match = Array.from(text.matchAll(regexp)).pop()

  if (!match || match.input === undefined || match.index === undefined) {
    return null
  }

  // JavaScript没有lookbehinds。这是一个检查第一个字符是一个空间或行的开始
  const matchPrefix = match.input.slice(Math.max(0, match.index - 1), match.index)
  const matchPrefixIsAllowed = new RegExp(`^[${allowedPrefixes?.join('')}\0]?$`).test(matchPrefix)

  if (allowedPrefixes !== null && !matchPrefixIsAllowed) {
    return null
  }

  // 文档中匹配的绝对位置
  const from = textFrom + match.index
  let to = from + match[0].length

  // 边缘情况处理；如果允许空格并且我们直接在两个触发器之间
  if (allowSpaces && suffix.test(text.slice(to - 1, to + 1))) {
    match[0] += ' '
    to += 1
  }

  // 如果$position位于匹配的子字符串中，则返回该范围
  if (from < $position.pos && to >= $position.pos) {
    return {
      range: {
        from,
        to,
      },
      query: match[0].slice(char.length),
      text: match[0],
    }
  }

  return null
}
