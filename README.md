# Tiptap 编辑器

Tiptap 编辑器是一个无头的、框架无关的富文本编辑器，可通过扩展进行自定义和扩展。其无头本质意味着它没有预设的用户界面，提供完全的设计自由度（如需快速入门，请参见下方链接的[UI 模板](#示例codesandbox和ui模板)）。Tiptap 基于高度可靠的 [ProseMirror](https://github.com/ProseMirror/prosemirror) 库构建。

Tiptap 编辑器与开源协作后端 [Hocuspocus](https://github.com/ueberdosis/hocuspocus) 相辅相成。编辑器和 Hocuspocus 共同构成了 [Tiptap Suite](https://tiptap.dev/) 的基础。

[![构建状态](https://github.com/ueberdosis/tiptap/actions/workflows/build.yml/badge.svg)](https://github.com/ueberdosis/tiptap/actions/workflows/build.yml)
[![发版](https://img.shields.io/npm/v/@tiptap/core.svg?label=version)](https://www.npmjs.com/package/@tiptap/core)
[![下载](https://img.shields.io/npm/dm/@tiptap/core.svg)](https://npmcharts.com/compare/@tiptap/core?minimal=true)
[![许可证](https://img.shields.io/npm/l/@tiptap/core.svg)](https://www.npmjs.com/package/@tiptap/core)
[![聊天](https://img.shields.io/badge/chat-on%20discord-7289da.svg?sanitize=true)](https://discord.gg/WtJ49jGshW)
[![赞助](https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub)](https://github.com/sponsors/ueberdosis)

### Tiptap 编辑器如何工作？

- **无头框架：** Tiptap 不依赖于用户界面。因此无需类覆盖或代码黑客。如果您需要 UI 示例，可以浏览下方链接的[UI 模板](#示例codesandbox和ui模板)。
- **框架无关：** Tiptap 编辑器设计为可跨不同前端框架工作。这意味着无论您使用 Vue、React 还是纯 JavaScript，Tiptap 都能无缝集成，没有兼容性问题。
- **基于扩展：** Tiptap 中的扩展允许定制编辑体验，从简单的文本样式到高级功能如拖放块编辑。您可以从[文档](https://tiptap.dev/docs/editor/extensions)和[社区](https://github.com/ueberdosis/awesome-tiptap/#community-extensions)中提供的 100 多个扩展中进行选择，以增强编辑器的功能。
- **自定义用户体验：** 编辑器的构建旨在让您控制定义自己的[扩展](https://tiptap.dev/docs/editor/guide/custom-extensions)和[节点](https://tiptap.dev/docs/editor/api/nodes)。

### 编辑器专业扩展

**专业扩展**是一组增强 Tiptap 编辑器功能的高级功能。它们是可以集成到基础编辑器中的附加功能，提供更复杂的编辑选项。

核心功能包括协作编辑（允许多用户同时编辑文档）、拖放文件管理（便于处理文档和媒体）以及唯一节点 ID 分配。查看[这里](https://tiptap.dev/docs/editor/extensions)的文档了解详情。

专业扩展对拥有 [Tiptap 账户](https://cloud.tiptap.dev/pro-extensions)的用户免费。注册后，请查看您账户中的指南。

### 使您的编辑器支持协作

对协作编辑感兴趣？查看我们的开源包 [Hocuspocus](https://github.com/ueberdosis/hocuspocus) - 一个围绕 [Yjs](https://github.com/yjs/yjs) 的 CRDT 能力构建的协作后端。Hocuspocus 是 [Tiptap Suite](https://tiptap.dev/) 的基础。

## 文档

欲了解更详细的信息，请查看我们的[文档](https://tiptap.dev/docs/editor/installation)。如果您遇到任何问题或对我们的系统有建议，请提出 issue。

### 示例、CodeSandbox 和 UI 模板

查看[示例以了解 Tiptap 的实际效果](https://tiptap.dev/examples)或查看并 fork 我们的 codesandbox。

- [Tiptap 编辑器的基本示例](https://codesandbox.io/p/devbox/editor-9x9dkd?embed=1&file=%2Fsrc%2FApp.js)
- [支持协作的 Tiptap CodeSandbox](https://codesandbox.io/p/devbox/collaboration-4stk94)
- React 类 Notion 块编辑器模板：[演示](https://templates.tiptap.dev/)

## 关于 Tiptap

Tiptap 是一系列基于开源技术的开发者组件集合，是我们高级付费功能的基础。它包括开源编辑器组件、协作功能、内容 AI 和 Tiptap Cloud。我们正在开发开源产品，这些产品也塑造了我们的付费功能。我们致力于改进两者，确保每次更新的质量和可靠性。

有关更多详细信息，请访问 Tiptap [文档](https://tiptap.dev/docs/editor/introduction)或[网站](https://tiptap.dev/)。

### 社区

如需帮助、讨论最佳实践或任何其他有利于搜索的对话：

[在 GitHub 上讨论 Tiptap](https://github.com/ueberdosis/tiptap/discussions)

### 赞助商 💖

<table>
  <tr>
    <td align="center">
      <a href="https://www.complish.app/">
        <img src="https://uploads-ssl.webflow.com/5fa93d27380666789a1cbbd3/5fae50824b4d2d06f3d2898f_Frame%20374.png" width="25"><br>
        <strong>Complish</strong>
      </a>
    </td>
    <td align="center">
      <a href="https://www.storyblok.com/">
        <img src="https://unavatar.io/github/storyblok" width="25"><br>
        <strong>Storyblok</strong>
      </a>
    </td>
    <td align="center">
      <a href="https://posthog.com/">
        <img src="https://unavatar.io/github/posthog" width="25"><br>
        <strong>PostHog</strong>
      </a>
    </td>
    <td align="center" width="100">
      <a href="https://reflect.app/">
        <img src="https://unavatar.io/reflect.app" width="25"><br>
        <strong>Reflect</strong>
      </a>
    </td>
    <td align="center" width="100">
      <a href="https://ziffmedia.com/">
        <img src="https://unavatar.io/github/ziffmedia" width="25"><br>
        <strong>Ziff Media</strong>
      </a>
    </td>
    <td align="center" width="100">
      <a href="https://www.basewell.com/">
        <img src="https://unavatar.io/github/Basewell" width="25"><br>
        <strong>Basewell</strong>
      </a>
    </td>
    <td align="center" width="100">
      <a href="https://poggio.io">
        <img src="https://unavatar.io/github/poggiolabs" width="25"><br>
        <strong>Poggio</strong>
      </a>
    </td>
  </tr>
</table>

<table>

</table>

[iFixit](https://www.ifixit.com/)、[ApostropheCMS](https://apostrophecms.com/)、[Novadiscovery](http://www.novadiscovery.com/)、[Omics Data Automation](https://www.omicsautomation.com)、[Flow Mobile](https://www.flowmobile.app/)、[DocIQ](https://www.dociq.io/) 和[数百位优秀的个人](https://github.com/sponsors/ueberdosis)。

### 贡献

想为 Tiptap 编辑器核心添加一些自己的魔法？我们欢迎贡献！请查看我们的 [CONTRIBUTING](CONTRIBUTING.md) 指南了解如何开始。

### 贡献者

[Sam Willis](https://github.com/samwillis)、
[Brian Hung](https://github.com/BrianHung)、
[Dirk Holtwick](https://github.com/holtwick)、
[Sam Duvall](https://github.com/SamDuvall)、
[Christoph Flathmann](https://github.com/Chrissi2812)、
[Erick Wilder](https://github.com/erickwilder)、
[Marius Tolzmann](https://github.com/mariux)、
[jjangga0214](https://github.com/jjangga0214)、
[Maya Nedeljkovich](https://github.com/mayacoda)、
[Ryan Bliss](https://github.com/ryanbliss)、
[Gregor](https://github.com/gambolputty) 和[更多贡献者](../../contributors)。

## 许可证

MIT 许可证 (MIT)。请查看[许可证文件](LICENSE.md)获取更多信息。
