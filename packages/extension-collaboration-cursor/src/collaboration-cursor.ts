import { Extension } from '@tiptap/core'
import { DecorationAttrs } from '@tiptap/pm/view'
import { defaultSelectionBuilder, yCursorPlugin } from 'y-prosemirror'

type CollaborationCursorStorage = {
  users: { clientId: number, [key: string]: any }[],
}

export interface CollaborationCursorOptions {
  /**
   * Hocuspocus 提供者实例。这也可以是 TiptapCloudProvider 实例。
   * @type {HocuspocusProvider | TiptapCloudProvider}
   * @example new HocuspocusProvider()
   */
  provider: any,

  /**
   * 用户详情对象 – 可以随意添加属性
   * @example { name: 'John Doe', color: '#305500' }
   */
  user: Record<string, any>,

  /**
   * 一个返回光标 DOM 元素的函数。
   * @param user 用户详情对象
   * @example
   * render: user => {
   *  const cursor = document.createElement('span')
   *  cursor.classList.add('collaboration-cursor__caret')
   *  cursor.setAttribute('style', `border-color: ${user.color}`)
   *
   *  const label = document.createElement('div')
   *  label.classList.add('collaboration-cursor__label')
   *  label.setAttribute('style', `background-color: ${user.color}`)
   *  label.insertBefore(document.createTextNode(user.name), null)
   *
   *  cursor.insertBefore(label, null)
   *  return cursor
   * }
   */
  render (user: Record<string, any>): HTMLElement,

  /**
   * 一个返回 ProseMirror DecorationAttrs 对象的函数。
   * @param user 用户详情对象
   * @example
   * selectionRender: user => {
   * return {
   *  nodeName: 'span',
   *  class: 'collaboration-cursor__selection',
   *  style: `background-color: ${user.color}`,
   *  'data-user': user.name,
   * }
   */
  selectionRender (user: Record<string, any>): DecorationAttrs

  /**
   * @deprecated The "onUpdate" option is deprecated. Please use `editor.storage.collaborationCursor.users` instead. Read more: https://tiptap.dev/api/extensions/collaboration-cursor
   */
  onUpdate: (users: { clientId: number, [key: string]: any }[]) => null,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    collaborationCursor: {
      /**
       * 更新当前用户的详细信息
       * @example editor.commands.updateUser({ name: 'John Doe', color: '#305500' })
       */
      updateUser: (attributes: Record<string, any>) => ReturnType,
      /**
       * 更新当前用户的详细信息
       *
       * @deprecated The "user" command is deprecated. Please use "updateUser" instead. Read more: https://tiptap.dev/api/extensions/collaboration-cursor
       */
      user: (attributes: Record<string, any>) => ReturnType,
    }
  }
}

const awarenessStatesToArray = (states: Map<number, Record<string, any>>) => {
  return Array.from(states.entries()).map(([key, value]) => {
    return {
      clientId: key,
      ...value.user,
    }
  })
}

const defaultOnUpdate = () => null

/**
 * 此扩展允许您在您的编辑器中添加协作光标。
 * @see https://tiptap.dev/api/extensions/collaboration-cursor
 */
export const CollaborationCursor = Extension.create<CollaborationCursorOptions, CollaborationCursorStorage>({
  name: 'collaborationCursor',

  priority: 999,

  addOptions() {
    return {
      provider: null,
      user: {
        name: null,
        color: null,
      },
      render: user => {
        const cursor = document.createElement('span')

        cursor.classList.add('collaboration-cursor__caret')
        cursor.setAttribute('style', `border-color: ${user.color}`)

        const label = document.createElement('div')

        label.classList.add('collaboration-cursor__label')
        label.setAttribute('style', `background-color: ${user.color}`)
        label.insertBefore(document.createTextNode(user.name), null)
        cursor.insertBefore(label, null)

        return cursor
      },
      selectionRender: defaultSelectionBuilder,
      onUpdate: defaultOnUpdate,
    }
  },

  onCreate() {
    if (this.options.onUpdate !== defaultOnUpdate) {
      console.warn('[tiptap warn]: DEPRECATED: The "onUpdate" option is deprecated. Please use `editor.storage.collaborationCursor.users` instead. Read more: https://tiptap.dev/api/extensions/collaboration-cursor')
    }
    if (!this.options.provider) {
      throw new Error('The "provider" option is required for the CollaborationCursor extension')
    }
  },

  addStorage() {
    return {
      users: [],
    }
  },

  addCommands() {
    return {
      updateUser: attributes => () => {
        this.options.user = attributes

        this.options.provider.awareness.setLocalStateField('user', this.options.user)

        return true
      },
      user: attributes => ({ editor }) => {
        console.warn('[tiptap warn]: DEPRECATED: The "user" command is deprecated. Please use "updateUser" instead. Read more: https://tiptap.dev/api/extensions/collaboration-cursor')

        return editor.commands.updateUser(attributes)
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      yCursorPlugin(
        (() => {
          this.options.provider.awareness.setLocalStateField('user', this.options.user)

          this.storage.users = awarenessStatesToArray(this.options.provider.awareness.states)

          this.options.provider.awareness.on('update', () => {
            this.storage.users = awarenessStatesToArray(this.options.provider.awareness.states)
          })

          return this.options.provider.awareness
        })(),
        // @ts-ignore
        {
          cursorBuilder: this.options.render,
          selectionBuilder: this.options.selectionRender,
        },
      ),
    ]
  },
})
