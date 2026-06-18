import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createMindMap, createNode, LayoutType, ThemeType } from '@/data/types.js'
import { generateId, deepClone } from '@/utils/helpers.js'
import { applyLayout, getDescendantIds, getTreeHierarchy } from '@/utils/layout.js'

const STORAGE_KEY = 'vue_mindmap_data'

const loadFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) return JSON.parse(data)
  } catch (e) {
    console.error('Failed to load from storage:', e)
  }
  return null
}

const saveToStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save to storage:', e)
  }
}

const createSampleMindMap = () => {
  const map = createMindMap('我的思维导图')
  const rootId = generateId()
  map.rootNodeId = rootId
  map.nodes[rootId] = createNode(rootId, '中心主题', null, { shape: 'rect', bold: true, icon: 'Target' })

  const child1 = generateId()
  map.nodes[child1] = createNode(child1, '学习计划', rootId, { icon: 'Lightbulb', shape: 'ellipse' })
  const child2 = generateId()
  map.nodes[child2] = createNode(child2, '工作安排', rootId, { icon: 'Calendar', shape: 'diamond' })
  const child3 = generateId()
  map.nodes[child3] = createNode(child3, '创意灵感', rootId, { icon: 'Sparkles', shape: 'parallelogram' })

  const grandchild1 = generateId()
  map.nodes[grandchild1] = createNode(grandchild1, 'Vue 3 深入学习', child1)
  const grandchild2 = generateId()
  map.nodes[grandchild2] = createNode(grandchild2, '算法与数据结构', child1)
  const grandchild3 = generateId()
  map.nodes[grandchild3] = createNode(grandchild3, '产品需求评审', child2)
  const grandchild4 = generateId()
  map.nodes[grandchild4] = createNode(grandchild4, '技术架构设计', child2)
  const grandchild5 = generateId()
  map.nodes[grandchild5] = createNode(grandchild5, '新产品概念', child3)
  const grandchild6 = generateId()
  map.nodes[grandchild6] = createNode(grandchild6, '用户体验优化', child3)

  return map
}

export const useMindmapStore = defineStore('mindmap', () => {
  const mindmap = ref(null)
  const selectedNodeId = ref(null)
  const editingNodeId = ref(null)
  const nodePositions = ref({})

  const init = () => {
    const saved = loadFromStorage()
    if (saved) {
      mindmap.value = saved
    } else {
      mindmap.value = createSampleMindMap()
      saveToStorage(mindmap.value)
    }
    applyCurrentLayout()
    applyTheme(mindmap.value.theme)
  }

  const save = () => {
    if (mindmap.value) {
      mindmap.value.updatedAt = Date.now()
      saveToStorage(mindmap.value)
    }
  }

  const nodes = computed(() => mindmap.value?.nodes || {})
  const rootNode = computed(() => mindmap.value ? mindmap.value.nodes[mindmap.value.rootNodeId] : null)
  const selectedNode = computed(() => selectedNodeId.value ? mindmap.value?.nodes[selectedNodeId.value] : null)

  const getSiblings = (nodeId) => {
    const node = mindmap.value.nodes[nodeId]
    if (!node) return []
    return Object.values(mindmap.value.nodes)
      .filter(n => n.parentId === node.parentId)
      .sort((a, b) => {
        if (mindmap.value.layout === LayoutType.HORIZONTAL) return a.y - b.y
        if (mindmap.value.layout === LayoutType.VERTICAL) return a.x - b.x
        return 0
      })
  }

  const addChildNode = (parentId, text = '新节点') => {
    const id = generateId()
    const newNode = createNode(id, text, parentId)
    mindmap.value.nodes[id] = newNode
    selectedNodeId.value = id
    editingNodeId.value = id
    applyCurrentLayout()
    save()
    return id
  }

  const addSiblingNode = (nodeId, text = '新节点') => {
    const node = mindmap.value.nodes[nodeId]
    if (!node || !node.parentId) return null
    const id = generateId()
    const newNode = createNode(id, text, node.parentId)
    mindmap.value.nodes[id] = newNode
    selectedNodeId.value = id
    editingNodeId.value = id
    applyCurrentLayout()
    save()
    return id
  }

  const deleteNode = (nodeId) => {
    if (!mindmap.value.nodes[nodeId]) return
    if (nodeId === mindmap.value.rootNodeId) return
    
    const descendants = getDescendantIds(mindmap.value.nodes, nodeId)
    const node = mindmap.value.nodes[nodeId]
    const parentId = node.parentId
    
    descendants.forEach(id => {
      delete mindmap.value.nodes[id]
    })

    const siblings = Object.values(mindmap.value.nodes).filter(n => n.parentId === parentId)
    if (siblings.length > 0) {
      selectedNodeId.value = siblings[siblings.length - 1].id
    } else {
      selectedNodeId.value = parentId
    }

    applyCurrentLayout()
    save()
  }

  const updateNode = (nodeId, updates) => {
    if (mindmap.value.nodes[nodeId]) {
      mindmap.value.nodes[nodeId] = { ...mindmap.value.nodes[nodeId], ...updates }
      save()
    }
  }

  const toggleNodeExpand = (nodeId) => {
    if (mindmap.value.nodes[nodeId]) {
      mindmap.value.nodes[nodeId].expanded = !mindmap.value.nodes[nodeId].expanded
      applyCurrentLayout()
      save()
    }
  }

  const moveNode = (nodeId, newParentId, newIndex = -1) => {
    const node = mindmap.value.nodes[nodeId]
    if (!node || !newParentId) return
    if (getDescendantIds(mindmap.value.nodes, nodeId).includes(newParentId)) return
    
    node.parentId = newParentId
    applyCurrentLayout()
    save()
  }

  const moveNodePosition = (nodeId, x, y) => {
    if (mindmap.value.nodes[nodeId]) {
      mindmap.value.nodes[nodeId].x = x
      mindmap.value.nodes[nodeId].y = y
      nodePositions.value[nodeId] = { x, y }
      save()
    }
  }

  const applyCurrentLayout = () => {
    if (!mindmap.value) return
    const positions = applyLayout(mindmap.value.nodes, mindmap.value.rootNodeId, mindmap.value.layout)
    Object.keys(positions).forEach(nodeId => {
      if (mindmap.value.layout !== LayoutType.FREE) {
        if (mindmap.value.nodes[nodeId]) {
          mindmap.value.nodes[nodeId].x = positions[nodeId].x
          mindmap.value.nodes[nodeId].y = positions[nodeId].y
        }
      }
      nodePositions.value[nodeId] = positions[nodeId]
    })
  }

  const setLayout = (layout) => {
    mindmap.value.layout = layout
    applyCurrentLayout()
    save()
  }

  const applyTheme = (theme) => {
    mindmap.value.theme = theme
    document.documentElement.setAttribute('data-theme', theme)
    save()
  }

  const setTitle = (title) => {
    mindmap.value.title = title
    save()
  }

  const selectNode = (nodeId) => {
    selectedNodeId.value = nodeId
    editingNodeId.value = null
  }

  const startEditing = (nodeId) => {
    editingNodeId.value = nodeId
    selectedNodeId.value = nodeId
  }

  const stopEditing = () => {
    editingNodeId.value = null
  }

  const setViewport = (x, y, scale) => {
    mindmap.value.viewport = { x, y, scale }
    save()
  }

  const getNodesInOrder = computed(() => {
    if (!mindmap.value) return []
    return getTreeHierarchy(mindmap.value.nodes, mindmap.value.rootNodeId)
  })

  const importMindmap = (data) => {
    mindmap.value = data
    selectedNodeId.value = data.rootNodeId
    applyTheme(mindmap.value.theme)
    applyCurrentLayout()
    save()
  }

  const createNew = () => {
    mindmap.value = createMindMap('新思维导图')
    const rootId = generateId()
    mindmap.value.rootNodeId = rootId
    mindmap.value.nodes[rootId] = createNode(rootId, '中心主题', null, { shape: 'rect', bold: true })
    selectedNodeId.value = rootId
    applyTheme(ThemeType.CLASSIC)
    applyCurrentLayout()
    save()
  }

  return {
    mindmap,
    selectedNodeId,
    editingNodeId,
    nodePositions,
    nodes,
    rootNode,
    selectedNode,
    getNodesInOrder,
    init,
    save,
    addChildNode,
    addSiblingNode,
    deleteNode,
    updateNode,
    toggleNodeExpand,
    moveNode,
    moveNodePosition,
    applyCurrentLayout,
    setLayout,
    applyTheme,
    setTitle,
    selectNode,
    startEditing,
    stopEditing,
    setViewport,
    getSiblings,
    importMindmap,
    createNew
  }
})
