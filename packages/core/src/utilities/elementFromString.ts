const removeWhitespaces = (node: HTMLElement) => {
  const children = node.childNodes

  for (let i = children.length - 1; i >= 0; i -= 1) {
    const child = children[i]

    if (child.nodeType === 3 && child.nodeValue && /^(\n\s\s|\n)$/.test(child.nodeValue)) {
      node.removeChild(child)
    } else if (child.nodeType === 1) {
      removeWhitespaces(child as HTMLElement)
    }
  }

  return node
}

export function elementFromString(value: string): HTMLElement {
  // 添加一个包装器以保留前导和尾随空白
  const wrappedValue = `<body>${value}</body>`

  const html = new window.DOMParser().parseFromString(wrappedValue, 'text/html').body

  return removeWhitespaces(html)
}
