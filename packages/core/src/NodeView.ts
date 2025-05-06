import { NodeSelection } from '@tiptap/pm/state'
import { NodeView as ProseMirrorNodeView, ViewMutationRecord } from '@tiptap/pm/view'

import { Editor as CoreEditor } from './Editor.js'
import { DecorationWithType, NodeViewRendererOptions, NodeViewRendererProps } from './types.js'
import { isAndroid } from './utilities/isAndroid.js'
import { isiOS } from './utilities/isiOS.js'

/**
 * 节点视图用于自定义节点的渲染 DOM 结构。
 * @see https://tiptap.dev/guide/node-views
 */
export class NodeView<
  Component,
  NodeEditor extends CoreEditor = CoreEditor,
  Options extends NodeViewRendererOptions = NodeViewRendererOptions,
> implements ProseMirrorNodeView {
  component: Component

  editor: NodeEditor

  options: Options

  extension: NodeViewRendererProps['extension']

  node: NodeViewRendererProps['node']

  decorations: NodeViewRendererProps['decorations']

  innerDecorations: NodeViewRendererProps['innerDecorations']

  view: NodeViewRendererProps['view']

  getPos: NodeViewRendererProps['getPos']

  HTMLAttributes: NodeViewRendererProps['HTMLAttributes']

  isDragging = false

  constructor(component: Component, props: NodeViewRendererProps, options?: Partial<Options>) {
    this.component = component
    this.editor = props.editor as NodeEditor
    this.options = {
      stopEvent: null,
      ignoreMutation: null,
      ...options,
    } as Options
    this.extension = props.extension
    this.node = props.node
    this.decorations = props.decorations as DecorationWithType[]
    this.innerDecorations = props.innerDecorations
    this.view = props.view
    this.HTMLAttributes = props.HTMLAttributes
    this.getPos = props.getPos
    this.mount()
  }

  mount() {
    // eslint-disable-next-line
    return
  }

  get dom(): HTMLElement {
    return this.editor.view.dom as HTMLElement
  }

  get contentDOM(): HTMLElement | null {
    return null
  }

  onDragStart(event: DragEvent) {
    const { view } = this.editor
    const target = event.target as HTMLElement

    // 获取拖动手柄元素
    // `closest` 不适用于文本节点，所以我们可能需要使用它的父元素
    const dragHandle = target.nodeType === 3
      ? target.parentElement?.closest('[data-drag-handle]')
      : target.closest('[data-drag-handle]')

    if (!this.dom || this.contentDOM?.contains(target) || !dragHandle) {
      return
    }

    let x = 0
    let y = 0

    // 如果我们在使用不同的拖动手柄元素，则计算偏移量
    if (this.dom !== dragHandle) {
      const domBox = this.dom.getBoundingClientRect()
      const handleBox = dragHandle.getBoundingClientRect()

      // 在 React 中，我们必须通过 nativeEvent 到达 offsetX/offsetY。
      const offsetX = event.offsetX ?? (event as any).nativeEvent?.offsetX
      const offsetY = event.offsetY ?? (event as any).nativeEvent?.offsetY

      x = handleBox.x - domBox.x + offsetX
      y = handleBox.y - domBox.y + offsetY
    }

    const clonedNode = this.dom.cloneNode(true) as HTMLElement

    event.dataTransfer?.setDragImage(clonedNode, x, y)

    const pos = this.getPos()

    if (typeof pos !== 'number') {
      return
    }
    // 我们需要告诉 ProseMirror 我们想要移动整个节点
    // 所以我们创建一个 NodeSelection
    const selection = NodeSelection.create(view.state.doc, pos)
    const transaction = view.state.tr.setSelection(selection)

    view.dispatch(transaction)
  }

  stopEvent(event: Event) {
    if (!this.dom) {
      return false
    }

    if (typeof this.options.stopEvent === 'function') {
      return this.options.stopEvent({ event })
    }

    const target = event.target as HTMLElement
    const isInElement = this.dom.contains(target) && !this.contentDOM?.contains(target)

    // 任何来自子节点的事件都应该由 ProseMirror 处理
    if (!isInElement) {
      return false
    }

    const isDragEvent = event.type.startsWith('drag')
    const isDropEvent = event.type === 'drop'
    const isInput = ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable

    // 任何来自节点视图的输入事件都应该被 ProseMirror 忽略
    if (isInput && !isDropEvent && !isDragEvent) {
      return true
    }

    const { isEditable } = this.editor
    const { isDragging } = this
    const isDraggable = !!this.node.type.spec.draggable
    const isSelectable = NodeSelection.isSelectable(this.node)
    const isCopyEvent = event.type === 'copy'
    const isPasteEvent = event.type === 'paste'
    const isCutEvent = event.type === 'cut'
    const isClickEvent = event.type === 'mousedown'

    // ProseMirror 尝试拖动可选择节点
    // 即使 `draggable` 设置为 `false`
    // 这个修复可以防止这种情况
    if (!isDraggable && isSelectable && isDragEvent && event.target === this.dom) {
      event.preventDefault()
    }

    if (isDraggable && isDragEvent && !isDragging && event.target === this.dom) {
      event.preventDefault()
      return false
    }

    // 我们必须存储拖动已经开始
    if (isDraggable && isEditable && !isDragging && isClickEvent) {
      const dragHandle = target.closest('[data-drag-handle]')
      const isValidDragHandle = dragHandle && (this.dom === dragHandle || this.dom.contains(dragHandle))

      if (isValidDragHandle) {
        this.isDragging = true

        document.addEventListener(
          'dragend',
          () => {
            this.isDragging = false
          },
          { once: true },
        )

        document.addEventListener(
          'drop',
          () => {
            this.isDragging = false
          },
          { once: true },
        )

        document.addEventListener(
          'mouseup',
          () => {
            this.isDragging = false
          },
          { once: true },
        )
      }
    }

    // 这些事件由 ProseMirror 处理
    if (
      isDragging
      || isDropEvent
      || isCopyEvent
      || isPasteEvent
      || isCutEvent
      || (isClickEvent && isSelectable)
    ) {
      return false
    }

    return true
  }

  /**
   * 当 DOM [mutation](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) 或选择更改发生在视图中时调用。
   * @return `false` 如果编辑器应该重新读取选择或重新解析周围的突变
   * @return `true` 如果可以安全地忽略。
   */
  ignoreMutation(mutation: ViewMutationRecord) {
    if (!this.dom || !this.contentDOM) {
      return true
    }

    if (typeof this.options.ignoreMutation === 'function') {
      return this.options.ignoreMutation({ mutation })
    }

    // 一个叶子/原子节点对于 ProseMirror 来说就像一个黑盒子
    // 应该完全由节点视图处理
    if (this.node.isLeaf || this.node.isAtom) {
      return true
    }

    // ProseMirror 应该处理任何选择
    if (mutation.type === 'selection') {
      return false
    }

    // 尝试防止 iOS 和 Android 上的一个错误，该错误会在按下 Enter 时破坏节点视图
    // 这是因为 ProseMirror 无法阻止按下 Enter
    // 这将导致在按下 Enter 时重新渲染节点视图
    // 见：https://github.com/ueberdosis/tiptap/issues/1214
    // 见：https://github.com/ueberdosis/tiptap/issues/2534
    if (
      this.dom.contains(mutation.target)
      && mutation.type === 'childList'
      && (isiOS() || isAndroid())
      && this.editor.isFocused
    ) {
      const changedNodes = [
        ...Array.from(mutation.addedNodes),
        ...Array.from(mutation.removedNodes),
      ] as HTMLElement[]

      // 我们将检查每个更改的节点是否是 contentEditable
      // 确保它可能是由 ProseMirror 修改的
      if (changedNodes.every(node => node.isContentEditable)) {
        return false
      }
    }

    // 我们将允许 contentDOM 使用属性进行修改
    // 因此我们可以例如在节点视图中添加类
    if (this.contentDOM === mutation.target && mutation.type === 'attributes') {
      return true
    }

    // ProseMirror 应该处理 contentDOM 中的任何更改
    if (this.contentDOM.contains(mutation.target)) {
      return false
    }

    return true
  }

  /**
   * 更新 ProseMirror 节点的属性。
   */
  updateAttributes(attributes: Record<string, any>): void {
    this.editor.commands.command(({ tr }) => {
      const pos = this.getPos()

      if (typeof pos !== 'number') {
        return false
      }

      tr.setNodeMarkup(pos, undefined, {
        ...this.node.attrs,
        ...attributes,
      })

      return true
    })
  }

  /**
   * 删除节点。
   */
  deleteNode(): void {
    const from = this.getPos()

    if (typeof from !== 'number') {
      return
    }
    const to = from + this.node.nodeSize

    this.editor.commands.deleteRange({ from, to })
  }
}
