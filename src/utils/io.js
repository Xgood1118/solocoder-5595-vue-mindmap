import { createNode, createMindMap } from '@/data/types.js'
import { generateId, downloadFile, readFileAsText } from './helpers.js'

export const exportJSON = (mindmap) => {
  const data = JSON.stringify(mindmap, null, 2)
  downloadFile(data, `${mindmap.title}.json`, 'application/json')
}

export const importJSON = async (file) => {
  const text = await readFileAsText(file)
  return JSON.parse(text)
}

const buildMarkdownOutline = (nodes, nodeId, level = 0) => {
  const node = nodes[nodeId]
  if (!node) return ''
  let result = `${'#'.repeat(Math.min(level + 1, 6))} ${node.text}\n\n`
  const children = Object.values(nodes).filter(n => n.parentId === nodeId)
  children.forEach(child => {
    result += buildMarkdownOutline(nodes, child.id, level + 1)
  })
  return result
}

export const exportMarkdown = (mindmap) => {
  const content = buildMarkdownOutline(mindmap.nodes, mindmap.rootNodeId)
  downloadFile(content, `${mindmap.title}.md`, 'text/markdown')
}

const buildFreeMind = (nodes, nodeId) => {
  const node = nodes[nodeId]
  if (!node) return ''
  let xml = `<node TEXT="${node.text.replace(/"/g, '&quot;')}"`
  if (node.bold) xml += ' BOLD="true"'
  if (node.italic) xml += ' ITALIC="true"'
  if (!node.expanded) xml += ' FOLDED="true"'
  xml += '>'
  const children = Object.values(nodes).filter(n => n.parentId === nodeId)
  children.forEach(child => {
    xml += buildFreeMind(nodes, child.id)
  })
  xml += '</node>'
  return xml
}

export const exportFreeMind = (mindmap) => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<map version="1.0.1">\n'
  xml += buildFreeMind(mindmap.nodes, mindmap.rootNodeId)
  xml += '\n</map>'
  downloadFile(xml, `${mindmap.title}.mm`, 'application/xml')
}

const buildOPML = (nodes, nodeId) => {
  const node = nodes[nodeId]
  if (!node) return ''
  let xml = `<outline text="${node.text.replace(/"/g, '&quot;')}"`
  if (!node.expanded) xml += ' _status="collapsed"'
  xml += '>'
  const children = Object.values(nodes).filter(n => n.parentId === nodeId)
  children.forEach(child => {
    xml += buildOPML(nodes, child.id)
  })
  xml += '</outline>'
  return xml
}

export const exportOPML = (mindmap) => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<opml version="2.0">\n'
  xml += `<head><title>${mindmap.title}</title></head>\n`
  xml += '<body>\n'
  xml += buildOPML(mindmap.nodes, mindmap.rootNodeId)
  xml += '\n</body>\n</opml>'
  downloadFile(xml, `${mindmap.title}.opml`, 'application/xml')
}

export const exportSVG = (svgElement, filename) => {
  const serializer = new XMLSerializer()
  const source = serializer.serializeToString(svgElement)
  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const exportPNG = (svgElement, filename) => {
  const serializer = new XMLSerializer()
  const source = serializer.serializeToString(svgElement)
  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const scale = 2
    canvas.width = svgElement.clientWidth * scale
    canvas.height = svgElement.clientHeight * scale
    const ctx = canvas.getContext('2d')
    ctx.scale(scale, scale)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)
    URL.revokeObjectURL(url)
    canvas.toBlob((blob) => {
      const pngUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = pngUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(pngUrl)
    }, 'image/png')
  }
  img.src = url
}

const parseFreeMind = (xmlText) => {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
  const rootElement = xmlDoc.querySelector('map > node')
  if (!rootElement) return null

  const mindmap = createMindMap('Imported MindMap')
  const nodes = {}
  
  const parseNode = (element, parentId = null) => {
    const id = generateId()
    const node = createNode(id, element.getAttribute('TEXT') || '', parentId, {
      bold: element.getAttribute('BOLD') === 'true',
      italic: element.getAttribute('ITALIC') === 'true',
      expanded: element.getAttribute('FOLDED') !== 'true'
    })
    nodes[id] = node
    if (!parentId) mindmap.rootNodeId = id
    const children = element.querySelectorAll(':scope > node')
    children.forEach(child => parseNode(child, id))
  }
  
  parseNode(rootElement)
  mindmap.nodes = nodes
  return mindmap
}

const parseOPML = (xmlText) => {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
  const titleElement = xmlDoc.querySelector('head > title')
  const mindmap = createMindMap(titleElement?.textContent || 'Imported MindMap')
  const nodes = {}
  const body = xmlDoc.querySelector('body')
  if (!body) return mindmap

  const parseOutline = (element, parentId = null) => {
    const id = generateId()
    const node = createNode(id, element.getAttribute('text') || '', parentId, {
      expanded: element.getAttribute('_status') !== 'collapsed'
    })
    nodes[id] = node
    if (!parentId) mindmap.rootNodeId = id
    const children = element.querySelectorAll(':scope > outline')
    children.forEach(child => parseOutline(child, id))
  }

  const rootOutlines = body.querySelectorAll(':scope > outline')
  rootOutlines.forEach(outline => parseOutline(outline))
  mindmap.nodes = nodes
  return mindmap
}

export const importFromFile = async (file) => {
  const ext = file.name.split('.').pop().toLowerCase()
  const text = await readFileAsText(file)
  
  if (ext === 'json') {
    return JSON.parse(text)
  } else if (ext === 'mm') {
    return parseFreeMind(text)
  } else if (ext === 'opml' || ext === 'xml') {
    return parseOPML(text)
  }
  throw new Error('Unsupported file format')
}
