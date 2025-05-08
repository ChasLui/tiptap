import { mergeAttributes, Node, nodePasteRule } from '@tiptap/core'

import { getEmbedUrlFromYoutubeUrl, isValidYoutubeUrl, YOUTUBE_REGEX_GLOBAL } from './utils.js'

export interface YoutubeOptions {
  /**
   * 控制是否应添加 youtube 视频粘贴处理程序。
   * @default true
   * @example false
   */
  addPasteHandler: boolean;

  /**
   * 控制是否应允许 youtube 视频全屏。
   * @default true
   * @example false
   */
  allowFullscreen: boolean;

  /**
   * 控制是否应自动播放 youtube 视频。
   * @default false
   * @example true
   */
  autoplay: boolean;

  /**
   * youtube 视频中显示的标题语言。
   * @default undefined
   * @example 'en'
   */
  ccLanguage?: string;

  /**
   * 控制是否应在 youtube 视频中显示字幕。
   * @default undefined
   * @example true
   */
  ccLoadPolicy?: boolean;

  /**
   * 控制是否应在 youtube 视频中显示控件。
   * @default true
   * @example false
   */
  controls: boolean;

  /**
   * 控制是否应在 youtube 视频中禁用键盘控件。
   * @default false
   * @example true
   */
  disableKBcontrols: boolean;

  /**
   * 控制是否应在 youtube 视频中启用 iframe api。
   * @default false
   * @example true
   */
  enableIFrameApi: boolean;

  /**
   * youtube 视频的结束时间。
   * @default 0
   * @example 120
   */
  endTime: number;

  /**
   * youtube 视频的高度。
   * @default 480
   * @example 720
   */
  height: number;

  /**
   * youtube 视频的语言。
   * @default undefined
   * @example 'en'
   */
  interfaceLanguage?: string;

  /**
   * 控制是否应在 youtube 视频中显示视频注释。
   * @default 0
   * @example 1
   */
  ivLoadPolicy: number;

  /**
   * 控制是否应在 youtube 视频中循环。
   * @default false
   * @example true
   */
  loop: boolean;

  /**
   * 控制是否应在 youtube 视频中显示一个小 youtube 徽标。
   * @default false
   * @example true
   */
  modestBranding: boolean;

  /**
   * youtube 视频节点的 HTML 属性。
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>;

  /**
   * 控制 youtube 节点是否应内联。
   * @default false
   * @example true
   */
  inline: boolean;

  /**
   * 控制是否应从 youtube-nocookie.com 加载 youtube 视频。
   * @default false
   * @example true
   */
  nocookie: boolean;

  /**
   * youtube 视频的来源。
   * @default ''
   * @example 'https://tiptap.dev'
   */
  origin: string;

  /**
   * youtube 视频的播放列表。
   * @default ''
   * @example 'PLQg6GaokU5CwiVmsZ0dZm6VeIg0V5z1tK'
   */
  playlist: string;

  /**
   * youtube 视频进度条的颜色。
   * @default undefined
   * @example 'red'
   */
  progressBarColor?: string;

  /**
   * youtube 视频的宽度。
   * @default 640
   * @example 1280
   */
  width: number;

  /**
   * 控制是否在 youtube 视频结束时显示来自同一频道的相关 youtube 视频。
   * @default 1
   * @example 0
   */
  rel: number;
}

/**
 * 设置 youtube 视频的选项。
 */
type SetYoutubeVideoOptions = { src: string, width?: number, height?: number, start?: number }

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    youtube: {
      /**
       * 插入一个 youtube 视频
       * @param options The youtube video attributes
       * @example editor.commands.setYoutubeVideo({ src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
       */
      setYoutubeVideo: (options: SetYoutubeVideoOptions) => ReturnType,
    }
  }
}

/**
 * 此扩展添加了对 youtube 视频的支持。
 * @see https://www.tiptap.dev/api/nodes/youtube
 */
export const Youtube = Node.create<YoutubeOptions>({
  name: 'youtube',

  addOptions() {
    return {
      addPasteHandler: true,
      allowFullscreen: true,
      autoplay: false,
      ccLanguage: undefined,
      ccLoadPolicy: undefined,
      controls: true,
      disableKBcontrols: false,
      enableIFrameApi: false,
      endTime: 0,
      height: 480,
      interfaceLanguage: undefined,
      ivLoadPolicy: 0,
      loop: false,
      modestBranding: false,
      HTMLAttributes: {},
      inline: false,
      nocookie: false,
      origin: '',
      playlist: '',
      progressBarColor: undefined,
      width: 640,
      rel: 1,
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
      start: {
        default: 0,
      },
      width: {
        default: this.options.width,
      },
      height: {
        default: this.options.height,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-youtube-video] iframe',
      },
    ]
  },

  addCommands() {
    return {
      setYoutubeVideo: (options: SetYoutubeVideoOptions) => ({ commands }) => {
        if (!isValidYoutubeUrl(options.src)) {
          return false
        }

        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },

  addPasteRules() {
    if (!this.options.addPasteHandler) {
      return []
    }

    return [
      nodePasteRule({
        find: YOUTUBE_REGEX_GLOBAL,
        type: this.type,
        getAttributes: match => {
          return { src: match.input }
        },
      }),
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const embedUrl = getEmbedUrlFromYoutubeUrl({
      url: HTMLAttributes.src,
      allowFullscreen: this.options.allowFullscreen,
      autoplay: this.options.autoplay,
      ccLanguage: this.options.ccLanguage,
      ccLoadPolicy: this.options.ccLoadPolicy,
      controls: this.options.controls,
      disableKBcontrols: this.options.disableKBcontrols,
      enableIFrameApi: this.options.enableIFrameApi,
      endTime: this.options.endTime,
      interfaceLanguage: this.options.interfaceLanguage,
      ivLoadPolicy: this.options.ivLoadPolicy,
      loop: this.options.loop,
      modestBranding: this.options.modestBranding,
      nocookie: this.options.nocookie,
      origin: this.options.origin,
      playlist: this.options.playlist,
      progressBarColor: this.options.progressBarColor,
      startAt: HTMLAttributes.start || 0,
      rel: this.options.rel,
    })

    HTMLAttributes.src = embedUrl

    return [
      'div',
      { 'data-youtube-video': '' },
      [
        'iframe',
        mergeAttributes(
          this.options.HTMLAttributes,
          {
            width: this.options.width,
            height: this.options.height,
            allowfullscreen: this.options.allowFullscreen,
            autoplay: this.options.autoplay,
            ccLanguage: this.options.ccLanguage,
            ccLoadPolicy: this.options.ccLoadPolicy,
            disableKBcontrols: this.options.disableKBcontrols,
            enableIFrameApi: this.options.enableIFrameApi,
            endTime: this.options.endTime,
            interfaceLanguage: this.options.interfaceLanguage,
            ivLoadPolicy: this.options.ivLoadPolicy,
            loop: this.options.loop,
            modestBranding: this.options.modestBranding,
            origin: this.options.origin,
            playlist: this.options.playlist,
            progressBarColor: this.options.progressBarColor,
            rel: this.options.rel,
          },
          HTMLAttributes,
        ),
      ],
    ]
  },
})
