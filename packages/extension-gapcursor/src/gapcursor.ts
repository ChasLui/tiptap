import {
  callOrReturn,
  Extension,
  getExtensionField,
  ParentConfig,
} from '@tiptap/core'
import { gapCursor } from '@tiptap/pm/gapcursor'

declare module '@tiptap/core' {
  interface NodeConfig<Options, Storage> {
    /**
     * 一个函数，用于确定当前位置是否允许间隙光标。必须返回 `true` 或 `false`。
     * @default null
     */
    allowGapCursor?:
      | boolean
      | null
      | ((this: {
        name: string,
        options: Options,
        storage: Storage,
        parent: ParentConfig<NodeConfig<Options>>['allowGapCursor'],
      }) => boolean | null),
  }
}

/**
 * 此扩展允许您在您的编辑器中添加间隙光标。
 * 间隙光标是一个光标，当您点击一个没有内容的地方时出现，例如在节点之间。
 * @see https://tiptap.dev/api/extensions/gapcursor
 */
export const Gapcursor = Extension.create({
  name: 'gapCursor',

  addProseMirrorPlugins() {
    return [
      gapCursor(),
    ]
  },

  extendNodeSchema(extension) {
    const context = {
      name: extension.name,
      options: extension.options,
      storage: extension.storage,
    }

    return {
      allowGapCursor: callOrReturn(getExtensionField(extension, 'allowGapCursor', context)) ?? null,
    }
  },
})
