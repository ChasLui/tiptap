export function isiOS(): boolean {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod',
  ].includes(navigator.platform)
  // iPad 或 iOS 13 检测
  || (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
}
