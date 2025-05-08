import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { EditorView } from '@tiptap/pm/view'
import {
  redo,
  undo,
  ySyncPlugin,
  yUndoPlugin,
  yUndoPluginKey,
  yXmlFragmentToProsemirrorJSON,
} from 'y-prosemirror'
import { Doc, UndoManager, XmlFragment } from 'yjs'

type YSyncOpts = Parameters<typeof ySyncPlugin>[1];
type YUndoOpts = Parameters<typeof yUndoPlugin>[0];

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    collaboration: {
      /**
       * 撤销最近的更改
       * @example editor.commands.undo()
       */
      undo: () => ReturnType;
      /**
       * 重新应用反转的更改
       * @example editor.commands.redo()
       */
      redo: () => ReturnType;
    };
  }
}

export interface CollaborationStorage {
  /**
   * 是否当前禁用协作。
   * 禁用协作将阻止任何更改与他人同步。
   */
  isDisabled: boolean;
}

export interface CollaborationOptions {
  /**
   * 一个初始化的 Y.js 文档。
   * @example new Y.Doc()
   */
  document?: Doc | null;

  /**
   * Y.js 片段的名称，可以更改以与一个 Y.js 文档同步多个字段。
   * @default 'default'
   * @example 'my-custom-field'
   */
  field?: string;

  /**
   * 一个原始的 Y.js 片段，可以代替 `document` 和 `field`。
   * @example new Y.Doc().getXmlFragment('body')
   */
  fragment?: XmlFragment | null;

  /**
   * 当 Yjs 内容最初渲染到 Tiptap 时触发。
   */
  onFirstRender?: () => void;

  /**
   * Yjs 同步插件的选项。
   */
  ySyncOptions?: YSyncOpts;

  /**
   * Yjs 撤销插件的选项。
   */
  yUndoOptions?: YUndoOpts;
}

/**
 * 此扩展允许您与其他人实时协作。
 * @see https://tiptap.dev/api/extensions/collaboration
 */
export const Collaboration = Extension.create<CollaborationOptions, CollaborationStorage>({
  name: 'collaboration',

  priority: 1000,

  addOptions() {
    return {
      document: null,
      field: 'default',
      fragment: null,
    }
  },

  addStorage() {
    return {
      isDisabled: false,
    }
  },

  onCreate() {
    if (this.editor.extensionManager.extensions.find(extension => extension.name === 'history')) {
      console.warn(
        '[tiptap warn]: "@tiptap/extension-collaboration" comes with its own history support and is not compatible with "@tiptap/extension-history".',
      )
    }
  },

  addCommands() {
    return {
      undo:
        () => ({ tr, state, dispatch }) => {
          tr.setMeta('preventDispatch', true)

          const undoManager: UndoManager = yUndoPluginKey.getState(state).undoManager

          if (undoManager.undoStack.length === 0) {
            return false
          }

          if (!dispatch) {
            return true
          }

          return undo(state)
        },
      redo:
        () => ({ tr, state, dispatch }) => {
          tr.setMeta('preventDispatch', true)

          const undoManager: UndoManager = yUndoPluginKey.getState(state).undoManager

          if (undoManager.redoStack.length === 0) {
            return false
          }

          if (!dispatch) {
            return true
          }

          return redo(state)
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-z': () => this.editor.commands.undo(),
      'Mod-y': () => this.editor.commands.redo(),
      'Shift-Mod-z': () => this.editor.commands.redo(),
    }
  },

  addProseMirrorPlugins() {
    const fragment = this.options.fragment
      ? this.options.fragment
      : (this.options.document as Doc).getXmlFragment(this.options.field)

    // 快速修复，直到有官方实现（感谢 @hamflx）。
    // 参见 https://github.com/yjs/y-prosemirror/issues/114 和 https://github.com/yjs/y-prosemirror/issues/102
    const yUndoPluginInstance = yUndoPlugin(this.options.yUndoOptions)
    const originalUndoPluginView = yUndoPluginInstance.spec.view

    yUndoPluginInstance.spec.view = (view: EditorView) => {
      const { undoManager } = yUndoPluginKey.getState(view.state)

      if (undoManager.restore) {
        undoManager.restore()
        undoManager.restore = () => {
          // noop
        }
      }

      const viewRet = originalUndoPluginView ? originalUndoPluginView(view) : undefined

      return {
        destroy: () => {
          const hasUndoManSelf = undoManager.trackedOrigins.has(undoManager)
          // eslint-disable-next-line no-underscore-dangle
          const observers = undoManager._observers

          undoManager.restore = () => {
            if (hasUndoManSelf) {
              undoManager.trackedOrigins.add(undoManager)
            }

            undoManager.doc.on('afterTransaction', undoManager.afterTransactionHandler)
            // eslint-disable-next-line no-underscore-dangle
            undoManager._observers = observers
          }

          if (viewRet?.destroy) {
            viewRet.destroy()
          }
        },
      }
    }

    const ySyncPluginOptions: YSyncOpts = {
      ...this.options.ySyncOptions,
      onFirstRender: this.options.onFirstRender,
    }

    const ySyncPluginInstance = ySyncPlugin(fragment, ySyncPluginOptions)

    if (this.editor.options.enableContentCheck) {
      fragment.doc?.on('beforeTransaction', () => {
        try {
          const jsonContent = (yXmlFragmentToProsemirrorJSON(fragment))

          if (jsonContent.content.length === 0) {
            return
          }

          this.editor.schema.nodeFromJSON(jsonContent).check()
        } catch (error) {
          this.editor.emit('contentError', {
            error: error as Error,
            editor: this.editor,
            disableCollaboration: () => {
              fragment.doc?.destroy()
              this.storage.isDisabled = true
            },
          })
          // 如果内容无效，返回 false 以防止事务被应用
          return false
        }
      })
    }

    return [
      ySyncPluginInstance,
      yUndoPluginInstance,
      // 仅在内容检查启用时添加 filterInvalidContent 插件
      this.editor.options.enableContentCheck
        && new Plugin({
          key: new PluginKey('filterInvalidContent'),
          filterTransaction: () => {
            // 当协作被禁用时，阻止任何同步事务被应用
            if (this.storage.isDisabled) {
              // 销毁 Yjs 文档以防止任何进一步的同步事务
              fragment.doc?.destroy()

              return true
            }

            return true
          },
        }),
    ].filter(Boolean)
  },
})
