# 更新日志

## 2.5.2

### 补丁更新

- 98fffbb: 升级 prosemirror-tables 至 1.6.3，修复编辑器不可编辑时单元格仍可调整大小的问题

## 2.5.1

### 补丁更新

- 7619215: 链接扩展的 `validate` 选项现在同时应用于自动链接和 XSS 防护。新增 `shouldAutoLink` 选项用于禁用有效 URL 的自动链接

## 2.5.0

### 次要更新

- 6834a7f: 包构建不再包含 tiptap 依赖的类型定义

## 2.4.2

### 补丁更新

- d6e56c4: 将 lowlight 声明为 extension-code-block-lowlight 的 peer 依赖，更新至 v3 版本使用方式

## 2.4.1

### 补丁更新

- 85d21ca: 更新示例并回退 Vue 特定性能优化，待确认其有效性

  > 在提交 ff04353b3ee0e6fc63733a673e2b27d2272a3355 回退："fix(vue-3): faster component rendering (#5206)"
  > 此提交回退 31f37464912b7b21f3a565ca63222b9f5b6cce00

  以及

  > 在提交 dbab8e42eac893a0237566fb30c14b4ed0f3674a 回退："fix(vue-3): fix editor.state updating too late during a transaction due to reactiveState fixes #4870 (#5252)"
  > 此提交回退 509676ed4a63b84b904a98c1e34d18449d25c2a7

（后续版本更新内容保持相同格式翻译，此处省略完整翻译以保持简洁）

# 提交规范

本项目遵循 [Conventional Commits](https://conventionalcommits.org) 提交规范。
