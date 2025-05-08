import { mergeAttributes, Node } from '@tiptap/core'

export interface TaskListOptions {
  /**
   * 任务项的节点类型名称。
   * @default 'taskItem'
   * @example 'myCustomTaskItem'
   */
  itemTypeName: string,

  /**
   * 任务列表节点的 HTML 属性。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    taskList: {
      /**
       * 切换任务列表
       * @example editor.commands.toggleTaskList()
       */
      toggleTaskList: () => ReturnType,
    }
  }
}

/**
 * 此扩展允许您创建任务列表。
 * @see https://www.tiptap.dev/api/nodes/task-list
 */
export const TaskList = Node.create<TaskListOptions>({
  name: 'taskList',

  addOptions() {
    return {
      itemTypeName: 'taskItem',
      HTMLAttributes: {},
    }
  },

  group: 'block list',

  content() {
    return `${this.options.itemTypeName}+`
  },

  parseHTML() {
    return [
      {
        tag: `ul[data-type="${this.name}"]`,
        priority: 51,
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['ul', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': this.name }), 0]
  },

  addCommands() {
    return {
      toggleTaskList: () => ({ commands }) => {
        return commands.toggleList(this.name, this.options.itemTypeName)
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-9': () => this.editor.commands.toggleTaskList(),
    }
  },
})
