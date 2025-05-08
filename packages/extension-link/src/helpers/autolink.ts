import {
  combineTransactionSteps,
  findChildrenInRange,
  getChangedRanges,
  getMarksBetween,
  NodeWithPos,
} from '@tiptap/core'
import { MarkType } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { MultiToken, tokenize } from 'linkifyjs'

/**
 * 检查提供的令牌是否形成有效的链接结构，可以是单个链接令牌
 * 或括号或方括号包围的链接令牌。
 *
 * 这确保了只有完整的和有效的文本被超链接，防止了这样的情况，
 * 一个有效的顶级域（TLD）立即跟随一个无效的字符，如一个数字。例如，
 * 使用 Linkify 的 `find` 方法输入 `example.com1` 将导致
 * `example.com` 被链接，而尾随的 `1` 作为纯文本保留。通过使用 `tokenize`
 * 方法，我们可以对输入文本进行更全面的验证。
 */
function isValidLinkStructure(tokens: Array<ReturnType<MultiToken['toObject']>>) {
  if (tokens.length === 1) {
    return tokens[0].isLink
  }

  if (tokens.length === 3 && tokens[1].isLink) {
    return ['()', '[]'].includes(tokens[0].value + tokens[2].value)
  }

  return false
}

type AutolinkOptions = {
  type: MarkType
  defaultProtocol: string
  validate: (url: string) => boolean
  shouldAutoLink: (url: string) => boolean
}

/**
 * 此插件允许您自动将链接添加到您的编辑器中。
 * @param options 插件选项
 * @returns 插件实例
 */
export function autolink(options: AutolinkOptions): Plugin {
  return new Plugin({
    key: new PluginKey('autolink'),
    appendTransaction: (transactions, oldState, newState) => {
      /**
       * 事务是否更改了文档？
       */
      const docChanges = transactions.some(transaction => transaction.docChanged) && !oldState.doc.eq(newState.doc)

      /**
       * 如果事务不是文档更改，或者事务有 `preventAutolink` 的元数据，则阻止自动链接。
       */
      const preventAutolink = transactions.some(transaction => transaction.getMeta('preventAutolink'))

      /**
       * 如果事务不是文档更改，或者事务有 `preventAutolink` 的元数据，则阻止自动链接。
       */
      if (!docChanges || preventAutolink) {
        return
      }

      const { tr } = newState
      const transform = combineTransactionSteps(oldState.doc, [...transactions])
      const changes = getChangedRanges(transform)

      changes.forEach(({ newRange }) => {
        // 现在让我们看看我们是否可以添加新的链接。
        const nodesInChangedRanges = findChildrenInRange(
          newState.doc,
          newRange,
          node => node.isTextblock,
        )

        let textBlock: NodeWithPos | undefined
        let textBeforeWhitespace: string | undefined

        if (nodesInChangedRanges.length > 1) {
          // 抓取在更改范围内（例如，当按下回车键时，两个段落中的第一个）的第一个节点。
          textBlock = nodesInChangedRanges[0]
          textBeforeWhitespace = newState.doc.textBetween(
            textBlock.pos,
            textBlock.pos + textBlock.node.nodeSize,
            undefined,
            ' ',
          )
        } else if (
          nodesInChangedRanges.length
          // 我们想确保包含块分隔符参数以将硬断行视为空格。
          && newState.doc.textBetween(newRange.from, newRange.to, ' ', ' ').endsWith(' ')
        ) {
          textBlock = nodesInChangedRanges[0]
          textBeforeWhitespace = newState.doc.textBetween(
            textBlock.pos,
            newRange.to,
            undefined,
            ' ',
          )
        }

        if (textBlock && textBeforeWhitespace) {
          const wordsBeforeWhitespace = textBeforeWhitespace.split(' ').filter(s => s !== '')

          if (wordsBeforeWhitespace.length <= 0) {
            return false
          }

          const lastWordBeforeSpace = wordsBeforeWhitespace[wordsBeforeWhitespace.length - 1]
          const lastWordAndBlockOffset = textBlock.pos + textBeforeWhitespace.lastIndexOf(lastWordBeforeSpace)

          if (!lastWordBeforeSpace) {
            return false
          }

          const linksBeforeSpace = tokenize(lastWordBeforeSpace).map(t => t.toObject(options.defaultProtocol))

          if (!isValidLinkStructure(linksBeforeSpace)) {
            return false
          }

          linksBeforeSpace
            .filter(link => link.isLink)
            // 计算链接位置。
            .map(link => ({
              ...link,
              from: lastWordAndBlockOffset + link.start + 1,
              to: lastWordAndBlockOffset + link.end + 1,
            }))
            // 忽略代码标记中的链接
            .filter(link => {
              if (!newState.schema.marks.code) {
                return true
              }

              return !newState.doc.rangeHasMark(
                link.from,
                link.to,
                newState.schema.marks.code,
              )
            })
            // 验证链接
            .filter(link => options.validate(link.value))
            // 检查是否应自动链接
            .filter(link => options.shouldAutoLink(link.value))
            // 添加链接标记。
            .forEach(link => {
              if (getMarksBetween(link.from, link.to, newState.doc).some(item => item.mark.type === options.type)) {
                return
              }

              tr.addMark(
                link.from,
                link.to,
                options.type.create({
                  href: link.href,
                }),
              )
            })
        }
      })

      if (!tr.steps.length) {
        return
      }

      return tr
    },
  })
}
