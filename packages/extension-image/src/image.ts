import {
  mergeAttributes,
  Node,
  nodeInputRule,
} from '@tiptap/core'

export interface ImageOptions {
  /**
   * 控制图像节点是否内联。
   * @default false
   * @example true
   */
  inline: boolean;

  /**
   * 控制是否允许 base64 图像。启用此选项以允许
   * base64 图像 URL 在 `src` 属性中。
   * @default false
   * @example true
   */
  allowBase64: boolean;

  /**
   * 要添加到图像元素的 HTML 属性。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>;
}

export interface SetImageOptions {
  src: string;
  alt?: string;
  title?: string;
  width?: string;
  height?: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    image: {
      /**
       * 添加一个图像
       * @param options 图像属性
       * @example
       * editor
       *   .commands
       *   .setImage({ src: 'https://tiptap.dev/logo.png', alt: 'tiptap', title: 'tiptap logo' })
       */
      setImage: (options: SetImageOptions) => ReturnType;
    };
  }
}

/**
 * 匹配一个图像到 ![image](src "title") 在输入。
 */
export const inputRegex = /(?:^|\s)(!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\))$/

/**
 * 此扩展允许您插入图像。
 * @see https://www.tiptap.dev/api/nodes/image
 */
export const Image = Node.create<ImageOptions>({
  name: 'image',

  addOptions() {
    return {
      inline: false,
      allowBase64: false,
      HTMLAttributes: {},
    }
  },

  inline() {
    return this.options.inline
  },

  group() {
    return this.options.inline ? 'inline' : 'block'
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: this.options.allowBase64
          ? 'img[src]'
          : 'img[src]:not([src^="data:"])',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addCommands() {
    return {
      setImage: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes: match => {
          const [,, alt, src, title] = match

          return { src, alt, title }
        },
      }),
    ]
  },
})
