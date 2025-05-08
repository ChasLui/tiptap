export function getColStyleDeclaration(minWidth: number, width: number | undefined): [string, string] {
  if (width) {
    // 应用存储的宽度，除非它低于配置的最小单元格宽度
    return ['width', `${Math.max(width, minWidth)}px`]
  }

  // 如果列没有存储宽度，则设置最小宽度
  return ['min-width', `${minWidth}px`]

}
