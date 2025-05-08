import {
  Mark,
  mergeAttributes,
} from '@tiptap/core'

export interface TextStyleOptions {
  /**
   * HTML 属性添加到 span 元素。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>,
  /**
   * 启用时，在 HTML 解析期间将嵌套的 span 样式合并到子 span 中。
   * 这优先考虑子 span 的样式。
   * 用于解析在其他编辑器中创建的内容。
   * （修复 ProseMirror 的默认行为。）
   * @default false
   */
  mergeNestedSpanStyles: boolean,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textStyle: {
      /**
       * 删除没有内联样式属性的 span。
       * @example editor.commands.removeEmptyTextStyle()
       */
      removeEmptyTextStyle: () => ReturnType,
    }
  }
}

const mergeNestedSpanStyles = (element: HTMLElement) => {
  if (!element.children.length) { return }
  const childSpans = element.querySelectorAll('span')

  if (!childSpans) { return }

  childSpans.forEach(childSpan => {
    const childStyle = childSpan.getAttribute('style')
    const closestParentSpanStyleOfChild = childSpan.parentElement?.closest('span')?.getAttribute('style')

    childSpan.setAttribute('style', `${closestParentSpanStyleOfChild};${childStyle}`)

  })
}

/**
 * 此扩展允许您创建文本样式。它是默认情况下为 `textColor` 和 `backgroundColor` 扩展所需的。
 * @see https://www.tiptap.dev/api/marks/text-style
 */
export const TextStyle = Mark.create<TextStyleOptions>({
  name: 'textStyle',

  priority: 101,

  addOptions() {
    return {
      HTMLAttributes: {},
      mergeNestedSpanStyles: false,
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: element => {
          const hasStyles = (element as HTMLElement).hasAttribute('style')

          if (!hasStyles) {
            return false
          }
          if (this.options.mergeNestedSpanStyles) { mergeNestedSpanStyles(element) }

          return {}
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      removeEmptyTextStyle: () => ({ tr }) => {

        const { selection } = tr

        // 收集选择范围内的所有节点。
        // 我们需要单独遍历每个节点
        // 检查它是否有任何内联样式属性。
        // 否则，调用 commands.unsetMark(this.name)
        // 从选择范围内的所有节点中删除所有内容。
        tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {

          // 检查它是否是段落元素，如果是，则跳过此节点，因为我们只对内联文本节点（span）应用文本样式。
          if (node.isTextblock) {
            return true
          }

          // 检查节点是否没有内联样式属性。
          // 过滤掉非`textStyle`标记。
          if (
            !node.marks.filter(mark => mark.type === this.type).some(mark => Object.values(mark.attrs).some(value => !!value))) {
            // 仅为此节点删除`textStyle`标记
            tr.removeMark(pos, pos + node.nodeSize, this.type)
          }
        })

        return true
      },
    }
  },

})
