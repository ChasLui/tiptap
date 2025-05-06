import { Node as ProseMirrorNode } from '@tiptap/pm/model'

/**
 * 如果给定的 prosemirror 节点为空，则返回 true。
 */
export function isNodeEmpty(
  node: ProseMirrorNode,
  {
    checkChildren = true,
    ignoreWhitespace = false,
  }: {
    /**
     * 当为 true（默认）时，它也会检查所有子节点是否为空。
     */
    checkChildren?: boolean;
    /**
     * 当为 true 时，它会在检查空性时忽略空白。
     */
    ignoreWhitespace?: boolean;
  } = {},
): boolean {
  if (ignoreWhitespace) {
    if (node.type.name === 'hardBreak') {
      // 硬断行被认为是空的
      return true
    }
    if (node.isText) {
      return /^\s*$/m.test(node.text ?? '')
    }
  }

  if (node.isText) {
    return !node.text
  }

  if (node.isAtom || node.isLeaf) {
    return false
  }

  if (node.content.childCount === 0) {
    return true
  }

  if (checkChildren) {
    let isContentEmpty = true

    node.content.forEach(childNode => {
      if (isContentEmpty === false) {
        // 提前退出以提高性能
        return
      }

      if (!isNodeEmpty(childNode, { ignoreWhitespace, checkChildren })) {
        isContentEmpty = false
      }
    })

    return isContentEmpty
  }

  return false
}
