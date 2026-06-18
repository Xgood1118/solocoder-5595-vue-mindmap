import { LayoutType } from '@/data/types.js'
import { getNodeSize } from './helpers.js'

const HORIZONTAL_GAP = 180
const VERTICAL_GAP = 60
const RADIAL_RADIUS_STEP = 220

const buildTreeStructure = (nodes, rootId) => {
  const nodeMap = {}
  Object.values(nodes).forEach(node => {
    nodeMap[node.id] = { ...node, children: [] }
  })
  Object.values(nodeMap).forEach(node => {
    if (node.parentId && nodeMap[node.parentId]) {
      nodeMap[node.parentId].children.push(node)
    }
  })
  return nodeMap[rootId]
}

const collectNodes = (root, result = []) => {
  if (!root) return result
  result.push(root)
  root.children.forEach(child => collectNodes(child, result))
  return result
}

const getSubtreeHeight = (node) => {
  if (!node.children || node.children.length === 0) {
    return getNodeSize(node.text).height + VERTICAL_GAP
  }
  let total = 0
  node.children.forEach(child => {
    if (child.expanded !== false) {
      total += getSubtreeHeight(child)
    } else {
      total += getNodeSize(child.text).height + VERTICAL_GAP
    }
  })
  return Math.max(total, getNodeSize(node.text).height + VERTICAL_GAP)
}

export const calculateHorizontalLayout = (nodes, rootId) => {
  const positions = {}
  const root = buildTreeStructure(nodes, rootId)
  if (!root) return positions

  const layoutNode = (node, x, y) => {
    const size = getNodeSize(node.text)
    positions[node.id] = { x, y }
    if (!node.children || node.children.length === 0 || node.expanded === false) {
      return { width: size.width, height: size.height }
    }

    let currentY = y
    const childrenHeights = node.children.map(child => {
      if (child.expanded === false) {
        return getNodeSize(child.text).height + VERTICAL_GAP
      }
      return getSubtreeHeight(child)
    })
    const totalHeight = childrenHeights.reduce((a, b) => a + b, 0) - VERTICAL_GAP
    currentY = y + (size.height - totalHeight) / 2

    node.children.forEach((child, index) => {
      const childX = x + size.width + HORIZONTAL_GAP
      layoutNode(child, childX, currentY)
      currentY += childrenHeights[index]
    })

    return { width: size.width + HORIZONTAL_GAP, height: totalHeight }
  }

  layoutNode(root, 100, 200)
  return positions
}

export const calculateVerticalLayout = (nodes, rootId) => {
  const positions = {}
  const root = buildTreeStructure(nodes, rootId)
  if (!root) return positions

  const getSubtreeWidth = (node) => {
    if (!node.children || node.children.length === 0 || node.expanded === false) {
      return getNodeSize(node.text).width + VERTICAL_GAP
    }
    let total = 0
    node.children.forEach(child => {
      total += getSubtreeWidth(child)
    })
    return Math.max(total, getNodeSize(node.text).width + VERTICAL_GAP)
  }

  const layoutNode = (node, x, y) => {
    const size = getNodeSize(node.text)
    positions[node.id] = { x, y }
    if (!node.children || node.children.length === 0 || node.expanded === false) {
      return { width: size.width, height: size.height }
    }

    let currentX = x
    const childrenWidths = node.children.map(child => getSubtreeWidth(child))
    const totalWidth = childrenWidths.reduce((a, b) => a + b, 0) - VERTICAL_GAP
    currentX = x + (size.width - totalWidth) / 2

    node.children.forEach((child, index) => {
      const childY = y + size.height + HORIZONTAL_GAP
      layoutNode(child, currentX, childY)
      currentX += childrenWidths[index]
    })

    return { width: totalWidth, height: size.height + HORIZONTAL_GAP }
  }

  layoutNode(root, 400, 100)
  return positions
}

export const calculateRadialLayout = (nodes, rootId) => {
  const positions = {}
  const root = buildTreeStructure(nodes, rootId)
  if (!root) return positions

  const centerX = 600
  const centerY = 400
  const rootSize = getNodeSize(root.text)
  positions[root.id] = {
    x: centerX - rootSize.width / 2,
    y: centerY - rootSize.height / 2
  }

  if (!root.children || root.children.length === 0) return positions

  const layoutLevel = (nodesAtLevel, level, startAngle, endAngle) => {
    if (nodesAtLevel.length === 0) return
    const radius = RADIAL_RADIUS_STEP * level
    const angleStep = (endAngle - startAngle) / nodesAtLevel.length

    nodesAtLevel.forEach((node, index) => {
      if (node.expanded === false) return
      const angle = startAngle + angleStep * (index + 0.5)
      const nodeX = centerX + radius * Math.cos(angle)
      const nodeY = centerY + radius * Math.sin(angle)
      const size = getNodeSize(node.text)
      positions[node.id] = {
        x: nodeX - size.width / 2,
        y: nodeY - size.height / 2
      }

      if (node.children && node.children.length > 0) {
        const childStartAngle = startAngle + angleStep * index
        const childEndAngle = startAngle + angleStep * (index + 1)
        layoutLevel(node.children, level + 1, childStartAngle, childEndAngle)
      }
    })
  }

  layoutLevel(root.children, 1, -Math.PI / 2, Math.PI * 1.5)
  return positions
}

export const applyLayout = (nodes, rootId, layoutType) => {
  let positions = {}
  switch (layoutType) {
    case LayoutType.HORIZONTAL:
      positions = calculateHorizontalLayout(nodes, rootId)
      break
    case LayoutType.VERTICAL:
      positions = calculateVerticalLayout(nodes, rootId)
      break
    case LayoutType.RADIAL:
      positions = calculateRadialLayout(nodes, rootId)
      break
    case LayoutType.FREE:
    case LayoutType.OUTLINE:
    default:
      Object.values(nodes).forEach(node => {
        positions[node.id] = { x: node.x, y: node.y }
      })
  }
  return positions
}

export const getTreeHierarchy = (nodes, rootId) => {
  const root = buildTreeStructure(nodes, rootId)
  return collectNodes(root)
}

export const getDescendantIds = (nodes, nodeId) => {
  const result = []
  const node = nodes[nodeId]
  if (!node) return result
  const collect = (id) => {
    result.push(id)
    Object.values(nodes).forEach(n => {
      if (n.parentId === id) collect(n.id)
    })
  }
  collect(nodeId)
  return result
}
