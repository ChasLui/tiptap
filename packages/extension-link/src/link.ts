import {
  Mark, markPasteRule, mergeAttributes, PasteRuleMatch,
} from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { find, registerCustomProtocol, reset } from 'linkifyjs'

import { autolink } from './helpers/autolink.js'
import { clickHandler } from './helpers/clickHandler.js'
import { pasteHandler } from './helpers/pasteHandler.js'

export interface LinkProtocolOptions {
  /**
   * 要注册的协议方案。
   * @default ''
   * @example 'ftp'
   * @example 'git'
   */
  scheme: string;

  /**
   * 如果启用，则允许在协议后使用可选的斜杠。
   * @default false
   * @example true
   */
  optionalSlashes?: boolean;
}

export const pasteRegex = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z]{2,}\b(?:[-a-zA-Z0-9@:%._+~#=?!&/]*)(?:[-a-zA-Z0-9@:%._+~#=?!&/]*)/gi

/**
 * @deprecated 现在默认行为是当编辑器不可编辑时打开链接。
 */
type DeprecatedOpenWhenNotEditable = 'whenNotEditable';

export interface LinkOptions {
  /**
   * 如果启用，则扩展将在您键入时自动添加链接。
   * @default true
   * @example false
   */
  autolink: boolean;

  /**
   * 一个数组，包含要与 linkifyjs 注册的自定义协议。
   * @default []
   * @example ['ftp', 'git']
   */
  protocols: Array<LinkProtocolOptions | string>;

  /**
   * 当没有指定协议时使用的默认协议。
   * @default 'http'
   */
  defaultProtocol: string;
  /**
   * 如果启用，则链接将在点击时打开。
   * @default true
   * @example false
   */
  openOnClick: boolean | DeprecatedOpenWhenNotEditable;
  /**
   * 如果粘贴的内容仅包含一个 URL，则将链接添加到当前选择中。
   * @default true
   * @example false
   */
  linkOnPaste: boolean;

  /**
   * 要添加到链接元素的 HTML 属性。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>;

  /**
   * @deprecated 使用 `shouldAutoLink` 选项代替。
   * 一个验证函数，用于修改自动链接的链接验证。
   * @param url - 要验证的 URL。
   * @returns - 如果 URL 有效，则为 true，否则为 false。
   */
  validate: (url: string) => boolean;

  /**
   * 一个验证函数，用于配置链接验证以防止 XSS 攻击。
   * 仅在您知道自己在做什么时修改此选项。
   *
   * @returns {boolean} `true` 如果 URL 有效，`false` 否则。
   *
   * @example
   * isAllowedUri: (url, { defaultValidate, protocols, defaultProtocol }) => {
   * return url.startsWith('./') || defaultValidate(url)
   * }
   */
  isAllowedUri: (
    /**
     * 要验证的 URL。
     */
    url: string,
    ctx: {
      /**
       * 默认验证函数。
       */
      defaultValidate: (url: string) => boolean;
      /**
       * 一个数组，包含 URL 的允许协议（例如，"http", "https"）。作为 `protocols` 选项定义。
       */
      protocols: Array<LinkProtocolOptions | string>;
      /**
       * 一个字符串，表示默认协议（例如，'http'）。作为 `defaultProtocol` 选项定义。
       */
      defaultProtocol: string;
    }
  ) => boolean;

  /**
   * 确定是否应自动链接有效的链接。
   *
   * @param {string} url - 已经验证的 URL。
   * @returns {boolean} - 如果链接应自动链接，则为 true，否则为 false。
   */
  shouldAutoLink: (url: string) => boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    link: {
      /**
       * 设置一个链接标记
       * @param attributes 链接属性
       * @example editor.commands.setLink({ href: 'https://tiptap.dev' })
       */
      setLink: (attributes: {
        href: string;
        target?: string | null;
        rel?: string | null;
        class?: string | null;
      }) => ReturnType;
      /**
       * 切换一个链接标记
       * @param attributes 链接属性
       * @example editor.commands.toggleLink({ href: 'https://tiptap.dev' })
       */
      toggleLink: (attributes: {
        href: string;
        target?: string | null;
        rel?: string | null;
        class?: string | null;
      }) => ReturnType;
      /**
       * 取消设置一个链接标记
       * @example editor.commands.unsetLink()
       */
      unsetLink: () => ReturnType;
    };
  }
}

// From DOMPurify
// https://github.com/cure53/DOMPurify/blob/main/src/regexp.js
// eslint-disable-next-line no-control-regex
const ATTR_WHITESPACE = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g

export function isAllowedUri(uri: string | undefined, protocols?: LinkOptions['protocols']) {
  const allowedProtocols: string[] = [
    'http',
    'https',
    'ftp',
    'ftps',
    'mailto',
    'tel',
    'callto',
    'sms',
    'cid',
    'xmpp',
  ]

  if (protocols) {
    protocols.forEach(protocol => {
      const nextProtocol = typeof protocol === 'string' ? protocol : protocol.scheme

      if (nextProtocol) {
        allowedProtocols.push(nextProtocol)
      }
    })
  }

  return (
    !uri
    || uri
      .replace(ATTR_WHITESPACE, '')
      .match(
        new RegExp(
          // eslint-disable-next-line no-useless-escape
          `^(?:(?:${allowedProtocols.join('|')}):|[^a-z]|[a-z0-9+.\-]+(?:[^a-z+.\-:]|$))`,
          'i',
        ),
      )
  )
}

/**
 * 此扩展允许您创建链接。
 * @see https://www.tiptap.dev/api/marks/link
 */
export const Link = Mark.create<LinkOptions>({
  name: 'link',

  priority: 1000,

  keepOnSplit: false,

  exitable: true,

  onCreate() {
    if (this.options.validate && !this.options.shouldAutoLink) {
      // 将 validate 函数复制到 shouldAutoLink 选项
      this.options.shouldAutoLink = this.options.validate
      console.warn(
        'The `validate` option is deprecated. Rename to the `shouldAutoLink` option instead.',
      )
    }
    this.options.protocols.forEach(protocol => {
      if (typeof protocol === 'string') {
        registerCustomProtocol(protocol)
        return
      }
      registerCustomProtocol(protocol.scheme, protocol.optionalSlashes)
    })
  },

  onDestroy() {
    reset()
  },

  inclusive() {
    return this.options.autolink
  },

  addOptions() {
    return {
      openOnClick: true,
      linkOnPaste: true,
      autolink: true,
      protocols: [],
      defaultProtocol: 'http',
      HTMLAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
        class: null,
      },
      isAllowedUri: (url, ctx) => !!isAllowedUri(url, ctx.protocols),
      validate: url => !!url,
      shouldAutoLink: url => !!url,
    }
  },

  addAttributes() {
    return {
      href: {
        default: null,
        parseHTML(element) {
          return element.getAttribute('href')
        },
      },
      target: {
        default: this.options.HTMLAttributes.target,
      },
      rel: {
        default: this.options.HTMLAttributes.rel,
      },
      class: {
        default: this.options.HTMLAttributes.class,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'a[href]',
        getAttrs: dom => {
          const href = (dom as HTMLElement).getAttribute('href')

          // 防止 XSS 攻击
          if (
            !href
            || !this.options.isAllowedUri(href, {
              defaultValidate: url => !!isAllowedUri(url, this.options.protocols),
              protocols: this.options.protocols,
              defaultProtocol: this.options.defaultProtocol,
            })
          ) {
            return false
          }
          return null
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    // 防止 XSS 攻击
    if (
      !this.options.isAllowedUri(HTMLAttributes.href, {
        defaultValidate: href => !!isAllowedUri(href, this.options.protocols),
        protocols: this.options.protocols,
        defaultProtocol: this.options.defaultProtocol,
      })
    ) {
      // 删除 href
      return [
        'a',
        mergeAttributes(this.options.HTMLAttributes, { ...HTMLAttributes, href: '' }),
        0,
      ]
    }

    return ['a', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setLink:
        attributes => ({ chain }) => {
          const { href } = attributes

          if (!this.options.isAllowedUri(href, {
            defaultValidate: url => !!isAllowedUri(url, this.options.protocols),
            protocols: this.options.protocols,
            defaultProtocol: this.options.defaultProtocol,
          })) {
            return false
          }

          return chain().setMark(this.name, attributes).setMeta('preventAutolink', true).run()
        },

      toggleLink:
        attributes => ({ chain }) => {
          const { href } = attributes

          if (!this.options.isAllowedUri(href, {
            defaultValidate: url => !!isAllowedUri(url, this.options.protocols),
            protocols: this.options.protocols,
            defaultProtocol: this.options.defaultProtocol,
          })) {
            return false
          }

          return chain()
            .toggleMark(this.name, attributes, { extendEmptyMarkRange: true })
            .setMeta('preventAutolink', true)
            .run()
        },

      unsetLink:
        () => ({ chain }) => {
          return chain()
            .unsetMark(this.name, { extendEmptyMarkRange: true })
            .setMeta('preventAutolink', true)
            .run()
        },
    }
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: text => {
          const foundLinks: PasteRuleMatch[] = []

          if (text) {
            const { protocols, defaultProtocol } = this.options
            const links = find(text).filter(
              item => item.isLink
                && this.options.isAllowedUri(item.value, {
                  defaultValidate: href => !!isAllowedUri(href, protocols),
                  protocols,
                  defaultProtocol,
                }),
            )

            if (links.length) {
              links.forEach(link => foundLinks.push({
                text: link.value,
                data: {
                  href: link.href,
                },
                index: link.start,
              }))
            }
          }

          return foundLinks
        },
        type: this.type,
        getAttributes: match => {
          return {
            href: match.data?.href,
          }
        },
      }),
    ]
  },

  addProseMirrorPlugins() {
    const plugins: Plugin[] = []
    const { protocols, defaultProtocol } = this.options

    if (this.options.autolink) {
      plugins.push(
        autolink({
          type: this.type,
          defaultProtocol: this.options.defaultProtocol,
          validate: url => this.options.isAllowedUri(url, {
            defaultValidate: href => !!isAllowedUri(href, protocols),
            protocols,
            defaultProtocol,
          }),
          shouldAutoLink: this.options.shouldAutoLink,
        }),
      )
    }

    if (this.options.openOnClick === true) {
      plugins.push(
        clickHandler({
          type: this.type,
        }),
      )
    }

    if (this.options.linkOnPaste) {
      plugins.push(
        pasteHandler({
          editor: this.editor,
          defaultProtocol: this.options.defaultProtocol,
          type: this.type,
        }),
      )
    }

    return plugins
  },
})
