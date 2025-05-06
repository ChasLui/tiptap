import type { Plugin, PluginKey } from '@tiptap/pm/state'

import { RawCommands } from '../types.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    setMeta: {
      /**
       * 在当前事务中存储一个元数据属性。
       * @param key 元数据属性的键。
       * @param value 要存储的值。
       * @example editor.commands.setMeta('foo', 'bar')
       */
      setMeta: (key: string | Plugin | PluginKey, value: any) => ReturnType,
    }
  }
}

export const setMeta: RawCommands['setMeta'] = (key, value) => ({ tr }) => {
  tr.setMeta(key, value)

  return true
}
