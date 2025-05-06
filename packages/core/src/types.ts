import {
  Mark as ProseMirrorMark,
  Node as ProseMirrorNode,
  ParseOptions,
  Slice,
} from '@tiptap/pm/model'
import { EditorState, Transaction } from '@tiptap/pm/state'
import { Mappable } from '@tiptap/pm/transform'
import {
  Decoration,
  DecorationAttrs,
  EditorProps,
  EditorView,
  NodeView,
  NodeViewConstructor,
  ViewMutationRecord,
} from '@tiptap/pm/view'

import { Editor } from './Editor.js'
import { Extension } from './Extension.js'
import {
  Commands, ExtensionConfig, MarkConfig, NodeConfig,
} from './index.js'
import { Mark } from './Mark.js'
import { Node } from './Node.js'

export type AnyConfig = ExtensionConfig | NodeConfig | MarkConfig;
export type AnyExtension = Extension | Node | Mark;
export type Extensions = AnyExtension[];

export type ParentConfig<T> = Partial<{
  [P in keyof T]: Required<T>[P] extends (...args: any) => any
    ? (...args: Parameters<Required<T>[P]>) => ReturnType<Required<T>[P]>
    : T[P];
}>;

export type Primitive = null | undefined | string | number | boolean | symbol | bigint;

export type RemoveThis<T> = T extends (...args: any) => any
  ? (...args: Parameters<T>) => ReturnType<T>
  : T;

export type MaybeReturnType<T> = T extends (...args: any) => any ? ReturnType<T> : T;

export type MaybeThisParameterType<T> = Exclude<T, Primitive> extends (...args: any) => any
  ? ThisParameterType<Exclude<T, Primitive>>
  : any;

export interface EditorEvents {
  beforeCreate: { editor: Editor };
  create: { editor: Editor };
  contentError: {
    editor: Editor;
    error: Error;
    /**
     * 如果调用，将重新初始化编辑器，删除协作扩展。
     * 这将防止同步回当前模式中不存在的删除内容。
     */
    disableCollaboration: () => void;
  };
  update: { editor: Editor; transaction: Transaction };
  selectionUpdate: { editor: Editor; transaction: Transaction };
  beforeTransaction: { editor: Editor; transaction: Transaction; nextState: EditorState };
  transaction: { editor: Editor; transaction: Transaction };
  focus: { editor: Editor; event: FocusEvent; transaction: Transaction };
  blur: { editor: Editor; event: FocusEvent; transaction: Transaction };
  destroy: void;
  paste: { editor: Editor; event: ClipboardEvent; slice: Slice };
  drop: { editor: Editor; event: DragEvent; slice: Slice; moved: boolean };
}

export type EnableRules = (AnyExtension | string)[] | boolean;

export interface EditorOptions {
  element: Element;
  content: Content;
  extensions: Extensions;
  injectCSS: boolean;
  injectNonce: string | undefined;
  autofocus: FocusPosition;
  editable: boolean;
  editorProps: EditorProps;
  parseOptions: ParseOptions;
  coreExtensionOptions?: {
    clipboardTextSerializer?: {
      blockSeparator?: string;
    };
  };
  enableInputRules: EnableRules;
  enablePasteRules: EnableRules;
  /**
   * 确定是否启用了核心扩展。
   *
   * 如果设置为 `false`，所有核心扩展都将被禁用。
   * 要禁用特定的核心扩展，请提供一个对象，其中键是扩展名称，值为 `false`。
   * 未在对象中列出的扩展将保持启用。
   *
   * @example
   * // 禁用所有核心扩展
   * enabledCoreExtensions: false
   *
   * @example
   * // 仅禁用 keymap 核心扩展
   * enabledCoreExtensions: { keymap: false }
   *
   * @default true
   */
  enableCoreExtensions?:
    | boolean
    | Partial<
        Record<
          | 'editable'
          | 'clipboardTextSerializer'
          | 'commands'
          | 'focusEvents'
          | 'keymap'
          | 'tabindex'
          | 'drop'
          | 'paste',
          false
        >
      >;
  /**
   * 如果设置为 `true`，编辑器将在初始化时检查内容是否存在错误。
   * 如果内容无效，将发出 `contentError` 事件。
   * 这可以用于向用户显示警告或错误消息。
   * @default false
   */
  enableContentCheck: boolean;
  onBeforeCreate: (props: EditorEvents['beforeCreate']) => void;
  onCreate: (props: EditorEvents['create']) => void;
  /**
   * 当编辑器在解析内容时遇到错误时调用。
   * 仅在 `enableContentCheck` 设置为 `true` 时启用。
   */
  onContentError: (props: EditorEvents['contentError']) => void;
  onUpdate: (props: EditorEvents['update']) => void;
  onSelectionUpdate: (props: EditorEvents['selectionUpdate']) => void;
  onTransaction: (props: EditorEvents['transaction']) => void;
  onFocus: (props: EditorEvents['focus']) => void;
  onBlur: (props: EditorEvents['blur']) => void;
  onDestroy: (props: EditorEvents['destroy']) => void;
  onPaste: (e: ClipboardEvent, slice: Slice) => void;
  onDrop: (e: DragEvent, slice: Slice, moved: boolean) => void;
}

export type HTMLContent = string;

export type JSONContent = {
  type?: string;
  attrs?: Record<string, any>;
  content?: JSONContent[];
  marks?: {
    type: string;
    attrs?: Record<string, any>;
    [key: string]: any;
  }[];
  text?: string;
  [key: string]: any;
};

export type Content = HTMLContent | JSONContent | JSONContent[] | null;

export type CommandProps = {
  editor: Editor;
  tr: Transaction;
  commands: SingleCommands;
  can: () => CanCommands;
  chain: () => ChainedCommands;
  state: EditorState;
  view: EditorView;
  dispatch: ((args?: any) => any) | undefined;
};

export type Command = (props: CommandProps) => boolean;

export type CommandSpec = (...args: any[]) => Command;

export type KeyboardShortcutCommand = (props: { editor: Editor }) => boolean;

export type Attribute = {
  default?: any;
  rendered?: boolean;
  renderHTML?: ((attributes: Record<string, any>) => Record<string, any> | null) | null;
  parseHTML?: ((element: HTMLElement) => any | null) | null;
  keepOnSplit?: boolean;
  isRequired?: boolean;
};

export type Attributes = {
  [key: string]: Attribute;
};

export type ExtensionAttribute = {
  type: string;
  name: string;
  attribute: Required<Attribute>;
};

export type GlobalAttributes = {
  /**
   * 应该应用此属性的节点和标记类型。
   */
  types: string[];
  /**
   * 要添加到节点或标记类型的属性。
   */
  attributes: Record<string, Attribute | undefined>;
}[];

export type PickValue<T, K extends keyof T> = T[K];

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

export type Diff<T extends keyof any, U extends keyof any> = ({ [P in T]: P } & {
  [P in U]: never;
} & { [x: string]: never })[T];

export type Overwrite<T, U> = Pick<T, Diff<keyof T, keyof U>> & U;

export type ValuesOf<T> = T[keyof T];

export type KeysWithTypeOf<T, Type> = { [P in keyof T]: T[P] extends Type ? P : never }[keyof T];

export type DOMNode = InstanceType<typeof window.Node>

/**
 * prosemirror-view 不导出 `Decoration` 的 `type` 属性。
 * 所以，这个定义了 `DecorationType` 接口，包括 `type` 属性。
 */
export interface DecorationType {
  spec: any
  map(mapping: Mappable, span: Decoration, offset: number, oldOffset: number): Decoration | null
  valid(node: Node, span: Decoration): boolean
  eq(other: DecorationType): boolean
  destroy(dom: DOMNode): void
  readonly attrs: DecorationAttrs
}

/**
 * prosemirror-view 不导出 `Decoration` 的 `type` 属性。
 * 这个添加了 `type` 属性到 `Decoration` 类型。
 */
export type DecorationWithType = Decoration & {
  type: DecorationType;
};

export interface NodeViewProps extends NodeViewRendererProps {
  // TODO 这个类型在技术上不正确，但这是我们目前可以做的最好的事情，因为 prosemirror 不暴露装饰的类型
  decorations: readonly DecorationWithType[];
  selected: boolean;
  updateAttributes: (attributes: Record<string, any>) => void;
  deleteNode: () => void;
}

export interface NodeViewRendererOptions {
  stopEvent: ((props: { event: Event }) => boolean) | null;
  ignoreMutation:
    | ((props: { mutation: ViewMutationRecord }) => boolean)
    | null;
  contentDOMElementTag: string;
}

export interface NodeViewRendererProps {
  // pass-through from prosemirror
  /**
   * 正在渲染的节点。
   */
  node: Parameters<NodeViewConstructor>[0];
  /**
   * 编辑器的视图。
   */
  view: Parameters<NodeViewConstructor>[1];
  /**
   * 一个可以调用的函数，用于获取节点的当前位置。
   */
  getPos: () => number; // TODO getPos 之前被错误地类型化，在下一个主要版本中更改为 `Parameters<NodeViewConstructor>[2];`
  /**
   * 一个包含节点或内联装饰的数组，这些装饰在节点周围是活动的。
   * 它们会自动以正常方式绘制，通常只需忽略它们，但也可以用作提供节点视图上下文信息的方法，而无需将其添加到文档中。
   */
  decorations: Parameters<NodeViewConstructor>[3];
  /**
   * 持有节点的内容装饰。如果您的视图没有内容或 contentDOM 属性，可以安全地忽略它，因为编辑器将在内容上绘制装饰。
   * 但如果你想要创建一个包含内容的嵌套编辑器，可能需要提供它作为 inner decorations。
   */
  innerDecorations: Parameters<NodeViewConstructor>[4];
  // tiptap-specific
  /**
   * 编辑器实例。
   */
  editor: Editor;
  /**
   * 负责节点的扩展。
   */
  extension: Node;
  /**
   * 应该添加到节点 DOM 元素的 HTML 属性。
   */
  HTMLAttributes: Record<string, any>;
}

export type NodeViewRenderer = (props: NodeViewRendererProps) => NodeView;

export type AnyCommands = Record<string, (...args: any[]) => Command>;

export type UnionCommands<T = Command> = UnionToIntersection<
  ValuesOf<Pick<Commands<T>, KeysWithTypeOf<Commands<T>, object>>>
>;

export type RawCommands = {
  [Item in keyof UnionCommands]: UnionCommands<Command>[Item];
};

export type SingleCommands = {
  [Item in keyof UnionCommands]: UnionCommands<boolean>[Item];
};

export type ChainedCommands = {
  [Item in keyof UnionCommands]: UnionCommands<ChainedCommands>[Item];
} & {
  run: () => boolean;
};

export type CanCommands = SingleCommands & { chain: () => ChainedCommands };

export type FocusPosition = 'start' | 'end' | 'all' | number | boolean | null;

export type Range = {
  from: number;
  to: number;
};

export type NodeRange = {
  node: ProseMirrorNode;
  from: number;
  to: number;
};

export type MarkRange = {
  mark: ProseMirrorMark;
  from: number;
  to: number;
};

export type Predicate = (node: ProseMirrorNode) => boolean;

export type NodeWithPos = {
  node: ProseMirrorNode;
  pos: number;
};

export type TextSerializer = (props: {
  node: ProseMirrorNode;
  pos: number;
  parent: ProseMirrorNode;
  index: number;
  range: Range;
}) => string;

export type ExtendedRegExpMatchArray = RegExpMatchArray & {
  data?: Record<string, any>;
};

export type Dispatch = ((args?: any) => any) | undefined;
