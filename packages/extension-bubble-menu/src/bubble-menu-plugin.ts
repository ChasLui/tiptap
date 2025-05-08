import {
  Editor, isNodeSelection, isTextSelection, posToDOMRect,
} from '@tiptap/core'
import { EditorState, Plugin, PluginKey } from '@tiptap/pm/state'
import { EditorView } from '@tiptap/pm/view'
import tippy, { Instance, Props } from 'tippy.js'

export interface BubbleMenuPluginProps {
  /**
   * 插件键。
   * @type {PluginKey | string}
   * @default 'bubbleMenu'
   */
  pluginKey: PluginKey | string

  /**
   * 编辑器实例。
   */
  editor: Editor

  /**
   * 包含您的菜单的 DOM 元素。
   * @type {HTMLElement}
   * @default null
   */
  element: HTMLElement

  /**
   * tippy.js 实例的选项。
   * @see https://atomiks.github.io/tippyjs/v6/all-props/
   */
  tippyOptions?: Partial<Props>

  /**
   * 在菜单应该更新之前等待的毫秒数。
   * 这可以防止性能问题。
   * @type {number}
   * @default 250
   */
  updateDelay?: number

  /**
   * 一个函数，用于确定菜单是否应该显示。
   * 如果此函数返回 `false`，菜单将被隐藏，否则将显示。
   */
  shouldShow?:
    | ((props: {
        editor: Editor
        element: HTMLElement
        view: EditorView
        state: EditorState
        oldState?: EditorState
        from: number
        to: number
      }) => boolean)
    | null
}

export type BubbleMenuViewProps = BubbleMenuPluginProps & {
  view: EditorView
}

export class BubbleMenuView {
  public editor: Editor

  public element: HTMLElement

  public view: EditorView

  public preventHide = false

  public tippy: Instance | undefined

  public tippyOptions?: Partial<Props>

  public updateDelay: number

  private updateDebounceTimer: number | undefined

  public shouldShow: Exclude<BubbleMenuPluginProps['shouldShow'], null> = ({
    view,
    state,
    from,
    to,
  }) => {
    const { doc, selection } = state
    const { empty } = selection

    // 有时检查 `empty` 是不够的。
    // 双击一个空段落返回一个节点大小为 2。
    // 所以我们也检查一个空文本大小。
    const isEmptyTextBlock = !doc.textBetween(from, to).length && isTextSelection(state.selection)

    // 当点击一个元素在气泡菜单中，编辑器 "blur" 事件被调用，
    // 气泡菜单项被聚焦。在这种情况下，我们应该
    // 考虑菜单作为编辑器的一部分并继续显示菜单
    const isChildOfMenu = this.element.contains(document.activeElement)

    const hasEditorFocus = view.hasFocus() || isChildOfMenu

    if (!hasEditorFocus || empty || isEmptyTextBlock || !this.editor.isEditable) {
      return false
    }

    return true
  }

  constructor({
    editor,
    element,
    view,
    tippyOptions = {},
    updateDelay = 250,
    shouldShow,
  }: BubbleMenuViewProps) {
    this.editor = editor
    this.element = element
    this.view = view
    this.updateDelay = updateDelay

    if (shouldShow) {
      this.shouldShow = shouldShow
    }

    this.element.addEventListener('mousedown', this.mousedownHandler, { capture: true })
    this.view.dom.addEventListener('dragstart', this.dragstartHandler)
    this.editor.on('focus', this.focusHandler)
    this.editor.on('blur', this.blurHandler)
    this.tippyOptions = tippyOptions
    // 将菜单内容从其当前父级分离
    this.element.remove()
    this.element.style.visibility = 'visible'
  }

  mousedownHandler = () => {
    this.preventHide = true
  }

  dragstartHandler = () => {
    this.hide()
  }

  focusHandler = () => {
    // 我们使用 `setTimeout` 来确保 `selection` 已经更新
    setTimeout(() => this.update(this.editor.view))
  }

  blurHandler = ({ event }: { event: FocusEvent }) => {
    if (this.preventHide) {
      this.preventHide = false

      return
    }

    if (event?.relatedTarget && this.element.parentNode?.contains(event.relatedTarget as Node)) {
      return
    }

    if (
      event?.relatedTarget === this.editor.view.dom
    ) {
      return
    }

    this.hide()
  }

  tippyBlurHandler = (event: FocusEvent) => {
    this.blurHandler({ event })
  }

  createTooltip() {
    const { element: editorElement } = this.editor.options
    const editorIsAttached = !!editorElement.parentElement

    if (this.tippy || !editorIsAttached) {
      return
    }

    this.tippy = tippy(editorElement, {
      duration: 0,
      getReferenceClientRect: null,
      content: this.element,
      interactive: true,
      trigger: 'manual',
      placement: 'top',
      hideOnClick: 'toggle',
      ...this.tippyOptions,
    })

    // 也许我们也必须隐藏 tippy 的 own blur 事件
    if (this.tippy.popper.firstChild) {
      (this.tippy.popper.firstChild as HTMLElement).addEventListener('blur', this.tippyBlurHandler)
    }
  }

  update(view: EditorView, oldState?: EditorState) {
    const { state } = view
    const hasValidSelection = state.selection.from !== state.selection.to

    if (this.updateDelay > 0 && hasValidSelection) {
      this.handleDebouncedUpdate(view, oldState)
      return
    }

    const selectionChanged = !oldState?.selection.eq(view.state.selection)
    const docChanged = !oldState?.doc.eq(view.state.doc)

    this.updateHandler(view, selectionChanged, docChanged, oldState)
  }

  handleDebouncedUpdate = (view: EditorView, oldState?: EditorState) => {
    const selectionChanged = !oldState?.selection.eq(view.state.selection)
    const docChanged = !oldState?.doc.eq(view.state.doc)

    if (!selectionChanged && !docChanged) {
      return
    }

    if (this.updateDebounceTimer) {
      clearTimeout(this.updateDebounceTimer)
    }

    this.updateDebounceTimer = window.setTimeout(() => {
      this.updateHandler(view, selectionChanged, docChanged, oldState)
    }, this.updateDelay)
  }

  updateHandler = (view: EditorView, selectionChanged: boolean, docChanged: boolean, oldState?: EditorState) => {
    const { state, composing } = view
    const { selection } = state

    const isSame = !selectionChanged && !docChanged

    if (composing || isSame) {
      return
    }

    this.createTooltip()

    // 支持 CellSelections
    const { ranges } = selection
    const from = Math.min(...ranges.map(range => range.$from.pos))
    const to = Math.max(...ranges.map(range => range.$to.pos))

    const shouldShow = this.shouldShow?.({
      editor: this.editor,
      element: this.element,
      view,
      state,
      oldState,
      from,
      to,
    })

    if (!shouldShow) {
      this.hide()

      return
    }

    this.tippy?.setProps({
      getReferenceClientRect:
        this.tippyOptions?.getReferenceClientRect
        || (() => {
          if (isNodeSelection(state.selection)) {
            let node = view.nodeDOM(from) as HTMLElement

            if (node) {
              const nodeViewWrapper = node.dataset.nodeViewWrapper ? node : node.querySelector('[data-node-view-wrapper]')

              if (nodeViewWrapper) {
                node = nodeViewWrapper.firstChild as HTMLElement
              }

              if (node) {
                return node.getBoundingClientRect()
              }
            }
          }

          return posToDOMRect(view, from, to)
        }),
    })

    this.show()
  }

  show() {
    this.tippy?.show()
  }

  hide() {
    this.tippy?.hide()
  }

  destroy() {
    if (this.tippy?.popper.firstChild) {
      (this.tippy.popper.firstChild as HTMLElement).removeEventListener(
        'blur',
        this.tippyBlurHandler,
      )
    }
    this.tippy?.destroy()
    this.element.removeEventListener('mousedown', this.mousedownHandler, { capture: true })
    this.view.dom.removeEventListener('dragstart', this.dragstartHandler)
    this.editor.off('focus', this.focusHandler)
    this.editor.off('blur', this.blurHandler)
  }
}

export const BubbleMenuPlugin = (options: BubbleMenuPluginProps) => {
  return new Plugin({
    key:
      typeof options.pluginKey === 'string' ? new PluginKey(options.pluginKey) : options.pluginKey,
    view: view => new BubbleMenuView({ view, ...options }),
  })
}
