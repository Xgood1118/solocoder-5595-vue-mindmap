export const generateId = () => {
  return 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}

export const getNodeSize = (text) => {
  const baseWidth = 80
  const baseHeight = 40
  const charWidth = 12
  const padding = 24
  const textLength = (text || '').length
  const width = Math.max(baseWidth, textLength * charWidth + padding)
  const height = baseHeight
  return { width, height }
}

export const getNodeCenter = (node) => {
  const size = getNodeSize(node.text)
  return {
    x: node.x + size.width / 2,
    y: node.y + size.height / 2
  }
}

export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max)
}

export const debounce = (fn, delay) => {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

export const downloadFile = (content, filename, mimeType = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}
