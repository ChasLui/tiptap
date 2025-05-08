import {
  KeyboardShortcutCommand, mergeAttributes, Node, wrappingInputRule,
} from '@tiptap/core'
import { Node as ProseMirrorNode } from '@tiptap/pm/model'

export interface TaskItemOptions {
  /**
   * 一个回调函数，当复选框在只读模式下被点击时被调用。
   * @param node 任务项的 ProseMirror 节点
   * @param checked 新的选中状态
   * @returns boolean
   */
  onReadOnlyChecked?: (node: ProseMirrorNode, checked: boolean) => boolean

  /**
   * 控制任务项是否可以嵌套。
   * @default false
   * @example true
   */
  nested: boolean

  /**
   * 要添加到任务项元素的 HTML 属性。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>

  /**
   * 任务列表节点的节点类型。
   * @default 'taskList'
   * @example 'myCustomTaskList'
   */
  taskListTypeName: string
}

/**
 * 匹配任务项到 - [ ] 输入。
 */
export const inputRegex = /^\s*(\[([( |x])?\])\s$/

/**
 * 此扩展允许您创建任务项。
 * @see https://www.tiptap.dev/api/nodes/task-item
 */
export const TaskItem = Node.create<TaskItemOptions>({
  name: 'taskItem',

  addOptions() {
    return {
      nested: false,
      HTMLAttributes: {},
      taskListTypeName: 'taskList',
    }
  },

  content() {
    return this.options.nested ? 'paragraph block*' : 'paragraph+'
  },

  defining: true,

  addAttributes() {
    return {
      checked: {
        default: false,
        keepOnSplit: false,
        parseHTML: element => {
          const dataChecked = element.getAttribute('data-checked')

          return dataChecked === '' || dataChecked === 'true'
        },
        renderHTML: attributes => ({
          'data-checked': attributes.checked,
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: `li[data-type="${this.name}"]`,
        priority: 51,
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'li',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': this.name,
      }),
      [
        'label',
        [
          'input',
          {
            type: 'checkbox',
            checked: node.attrs.checked ? 'checked' : null,
          },
        ],
        ['span'],
      ],
      ['div', 0],
    ]
  },

  addKeyboardShortcuts() {
    const shortcuts: {
      [key: string]: KeyboardShortcutCommand
    } = {
      Enter: () => this.editor.commands.splitListItem(this.name),
      'Shift-Tab': () => this.editor.commands.liftListItem(this.name),
    }

    if (!this.options.nested) {
      return shortcuts
    }

    return {
      ...shortcuts,
      Tab: () => this.editor.commands.sinkListItem(this.name),
    }
  },

  addNodeView() {
    return ({
      node, HTMLAttributes, getPos, editor,
    }) => {
      const listItem = document.createElement('li')
      const checkboxWrapper = document.createElement('label')
      const checkboxStyler = document.createElement('span')
      const checkbox = document.createElement('input')
      const content = document.createElement('div')

      checkboxWrapper.contentEditable = 'false'
      checkbox.type = 'checkbox'
      checkbox.addEventListener('mousedown', event => event.preventDefault())
      checkbox.addEventListener('change', event => {
        // 如果编辑器不可编辑并且我们没有处理只读检查的回调，我们必须撤销最新的更改
        if (!editor.isEditable && !this.options.onReadOnlyChecked) {
          checkbox.checked = !checkbox.checked

          return
        }

        const { checked } = event.target as any

        if (editor.isEditable && typeof getPos === 'function') {
          editor
            .chain()
            .focus(undefined, { scrollIntoView: false })
            .command(({ tr }) => {
              const position = getPos()

              if (typeof position !== 'number') {
                return false
              }
              const currentNode = tr.doc.nodeAt(position)

              tr.setNodeMarkup(position, undefined, {
                ...currentNode?.attrs,
                checked,
              })

              return true
            })
            .run()
        }
        if (!editor.isEditable && this.options.onReadOnlyChecked) {
          // 如果 onReadOnlyChecked 返回 false，重置状态
          if (!this.options.onReadOnlyChecked(node, checked)) {
            checkbox.checked = !checkbox.checked
          }
        }
      })

      Object.entries(this.options.HTMLAttributes).forEach(([key, value]) => {
        listItem.setAttribute(key, value)
      })

      listItem.dataset.checked = node.attrs.checked
      checkbox.checked = node.attrs.checked

      checkboxWrapper.append(checkbox, checkboxStyler)
      listItem.append(checkboxWrapper, content)

      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        listItem.setAttribute(key, value)
      })

      return {
        dom: listItem,
        contentDOM: content,
        update: updatedNode => {
          if (updatedNode.type !== this.type) {
            return false
          }

          listItem.dataset.checked = updatedNode.attrs.checked
          checkbox.checked = updatedNode.attrs.checked

          return true
        },
      }
    }
  },

  addInputRules() {
    return [
      wrappingInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes: match => ({
          checked: match[match.length - 1] === 'x',
        }),
      }),
    ]
  },
})
