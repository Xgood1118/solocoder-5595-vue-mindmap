<template>
  <div
    ref="canvasContainer"
    class="mindmap-canvas"
    @mousedown="onCanvasMouseDown"
    @wheel="onWheel"
    @dragover.prevent
    @drop="onDrop"
  >
    <div
      ref="canvasWrapper"
      class="canvas-wrapper"
      :class="{ 'presentation-transition': isPresentationMode }"
      :style="wrapperStyle"
    >
      <svg
        ref="svgRef"
        class="canvas-svg"
        :width="canvasWidth"
        :height="canvasHeight"
      >
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="var(--grid-line)" stroke-width="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        <g class="connections-layer">
          <MindmapConnection
            v-for="conn in viewportConnections"
            :key="`conn-${conn.from}-${conn.to}`"
            :from="nodes[conn.from]"
            :to="nodes[conn.to]"
            :curve="connectionStyle.curve"
            :width="connectionStyle.width"
            :color="connectionStyle.color || 'var(--connection)'"
          />
        </g>
        
        <g class="nodes-layer">
          <TransitionGroup name="node">
            <MindmapNode
              v-for="node in viewportNodes"
              :key="node.id"
              ref="nodeRefs"
              :node="node"
              :pos="getNodePosition(node.id)"
              :is-selected="node.id === selectedNodeId"
              :is-editing="node.id === editingNodeId"
              :is-presentation="isPresentationMode && presentationNodeId === node.id"
              :presentation-animate="presentationAnimateNodes.has(node.id)"
              :has-children="nodeHasChildren(node.id)"
              @select="onSelectNode"
              @edit-start="onEditStart"
              @edit-end="onEditEnd"
              @toggle-expand="onToggleExpand"
              @drag-start="onNodeDragStart"
            />
          </TransitionGroup>
        </g>

        <g v-if="dragIndicator.visible" class="drag-indicator">
          <line
            v-if="dragIndicator.type === 'before' || dragIndicator.type === 'after'"
            :x1="dragIndicator.x"
            :y1="dragIndicator.y"
            :x2="dragIndicator.x + dragIndicator.width"
            :y2="dragIndicator.y"
            stroke="var(--selected)"
            stroke-width="4"
            stroke-linecap="round"
          />
          <rect
            v-else-if="dragIndicator.type === 'child'"
            :x="dragIndicator.x"
            :y="dragIndicator.y"
            :width="dragIndicator.width"
            :height="dragIndicator.height"
            rx="12"
            fill="none"
            stroke="var(--selected)"
            stroke-width="3"
            stroke-dasharray="8,4"
          />
          <circle
            v-else-if="dragIndicator.type === 'insert'"
            :cx="dragIndicator.x"
            :cy="dragIndicator.y"
            r="8"
            fill="var(--selected)"
          />
        </g>

        <g v-if="isDragging && dragData" class="drag-ghost">
          <MindmapNode
            v-if="ghostNode"
            :node="ghostNode"
            :pos="ghostPosition"
            :is-selected="false"
            :is-editing="false"
            :is-presentation="false"
            :has-children="false"
          />
        </g>
      </svg>
    </div>

    <div class="canvas-controls">
      <button class="control-btn" @click="zoomIn">
        <component :is="ZoomIn" :size="18" />
      </button>
      <div class="zoom-level">{{ Math.round(scale * 100) }}%</div>
      <button class="control-btn" @click="zoomOut">
        <component :is="ZoomOut" :size="18" />
      </button>
      <button class="control-btn" @click="resetView">
        <component :is="Maximize" :size="18" />
      </button>
    </div>

    <div class="viewport-info" v-if="showViewportInfo">
      渲染 {{ viewportNodes.length }} / {{ visibleNodes.length }} 节点
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, reactive } from 'vue'
import { ZoomIn, ZoomOut, Maximize } from 'lucide-vue-next'
import MindmapNode from './MindmapNode.vue'
import MindmapConnection from './MindmapConnection.vue'
import { useMindmapStore } from '@/stores/mindmap.js'
import { usePresentationStore } from '@/stores/presentation.js'
import { getNodeSize } from '@/utils/helpers.js'
import { LayoutType } from '@/data/types.js'

const mindmapStore = useMindmapStore()
const presentationStore = usePresentationStore()

const canvasContainer = ref(null)
const canvasWrapper = ref(null)
const svgRef = ref(null)
const nodeRefs = ref({})

const viewportX = ref(0)
const viewportY = ref(0)
const scale = ref(1)
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })

const containerSize = reactive({ width: 0, height: 0 })
const showViewportInfo = ref(true)

const isDragging = ref(false)
const dragData = ref(null)
const ghostPosition = ref({ x: 0, y: 0 })
const ghostNode = computed(() => dragData.value ? mindmapStore.nodes[dragData.value.nodeId] : null)

const dragIndicator = reactive({
  visible: false,
  type: null,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  targetId: null,
  insertIndex: -1
})

const canvasWidth = ref(10000)
const canvasHeight = ref(8000)

const nodes = computed(() => mindmapStore.nodes)
const selectedNodeId = computed(() => mindmapStore.selectedNodeId)
const editingNodeId = computed(() => mindmapStore.editingNodeId)
const connectionStyle = computed(() => mindmapStore.mindmap?.connectionStyle || {})
const layout = computed(() => mindmapStore.mindmap?.layout)
const isPresentationMode = computed(() => presentationStore.isActive)
const presentationNodeId = computed(() => presentationStore.currentNode?.id)

const presentationAnimateNodes = reactive(new Set())

const visibleNodes = computed(() => {
  const allNodes = Object.values(nodes.value)
  if (!allNodes.length) return allNodes
  return allNodes.filter(node => {
    if (node.parentId) {
      const parent = nodes.value[node.parentId]
      if (parent && parent.expanded === false) return false
    }
    return true
  })
})

const viewportBounds = computed(() => {
  const margin = 400
  const left = (-viewportX.value / scale.value) - margin
  const top = (-viewportY.value / scale.value) - margin
  const right = left + (containerSize.width / scale.value) + margin * 2
  const bottom = top + (containerSize.height / scale.value) + margin * 2
  return { left, top, right, bottom }
})

const isNodeInViewport = (node) => {
  if (node.id === selectedNodeId.value) return true
  if (node.id === editingNodeId.value) return true
  if (node.id === presentationNodeId.value) return true
  if (isDragging.value && dragData.value && node.id === dragData.value.nodeId) return true
  if (dragIndicator.visible && dragIndicator.targetId === node.id) return true
  
  const size = getNodeSize(node.text)
  const { left, top, right, bottom } = viewportBounds.value
  return node.x + size.width >= left &&
         node.x <= right &&
         node.y + size.height >= top &&
         node.y <= bottom
}

const viewportNodes = computed(() => {
  return visibleNodes.value.filter(node => isNodeInViewport(node))
})

const viewportConnections = computed(() => {
  const conns = []
  const viewportNodeIds = new Set(viewportNodes.value.map(n => n.id))
  visibleNodes.value.forEach(node => {
    if (node.parentId && nodes.value[node.parentId]) {
      const parentVisible = visibleNodes.value.find(n => n.id === node.parentId)
      if (parentVisible) {
        if (viewportNodeIds.has(node.id) || viewportNodeIds.has(node.parentId)) {
          conns.push({ from: node.parentId, to: node.id })
        }
      }
    }
  })
  return conns
})

const wrapperStyle = computed(() => ({
  transform: `translate(${viewportX.value}px, ${viewportY.value}px) scale(${scale.value})`,
  transformOrigin: '0 0'
}))

const getNodePosition = (nodeId) => {
  const node = nodes.value[nodeId]
  if (!node) return { x: 0, y: 0 }
  return { x: node.x, y: node.y }
}

const nodeHasChildren = (nodeId) => {
  return Object.values(nodes.value).some(n => n.parentId === nodeId)
}

const getSiblingsOrdered = (parentId) => {
  const siblings = Object.values(nodes.value).filter(n => n.parentId === parentId)
  if (layout.value === LayoutType.HORIZONTAL) {
    return siblings.sort((a, b) => a.y - b.y)
  } else if (layout.value === LayoutType.VERTICAL) {
    return siblings.sort((a, b) => a.x - b.x)
  }
  return siblings
}

const onSelectNode = (nodeId) => {
  mindmapStore.selectNode(nodeId)
}

const onEditStart = (nodeId) => {
  mindmapStore.startEditing(nodeId)
}

const onEditEnd = ({ nodeId, text, action }) => {
  if (text !== null) {
    mindmapStore.updateNode(nodeId, { text })
  }
  mindmapStore.stopEditing()
}

const onToggleExpand = (nodeId) => {
  mindmapStore.toggleNodeExpand(nodeId)
}

const onCanvasMouseDown = (e) => {
  if (e.target.closest('.mindmap-node')) return
  if (e.target.closest('.canvas-controls')) return
  if (e.button === 0 || e.button === 1) {
    isPanning.value = true
    panStart.value = { x: e.clientX - viewportX.value, y: e.clientY - viewportY.value }
    document.body.style.cursor = 'grabbing'
  }
  mindmapStore.selectNode(null)
}

const updateContainerSize = () => {
  if (canvasContainer.value) {
    containerSize.width = canvasContainer.value.clientWidth
    containerSize.height = canvasContainer.value.clientHeight
  }
}

const debouncedUpdate = (() => {
  let timer = null
  return () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {}, 100)
  }
})()

const onMouseMove = (e) => {
  if (isPanning.value) {
    viewportX.value = e.clientX - panStart.value.x
    viewportY.value = e.clientY - panStart.value.y
    debouncedUpdate()
  }
  if (isDragging.value && dragData.value) {
    updateGhostPosition(e)
    updateDragIndicator(e)
  }
}

const onMouseUp = (e) => {
  if (isPanning.value) {
    isPanning.value = false
    document.body.style.cursor = ''
    mindmapStore.setViewport(viewportX.value, viewportY.value, scale.value)
  }
  if (isDragging.value) {
    finishDrag(e)
  }
}

const onWheel = (e) => {
  e.preventDefault()
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(0.2, Math.min(3, scale.value * delta))
  const rect = canvasContainer.value.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  viewportX.value = mouseX - (mouseX - viewportX.value) * (newScale / scale.value)
  viewportY.value = mouseY - (mouseY - viewportY.value) * (newScale / scale.value)
  scale.value = newScale
  mindmapStore.setViewport(viewportX.value, viewportY.value, scale.value)
  debouncedUpdate()
}

const zoomIn = () => {
  scale.value = Math.min(3, scale.value * 1.2)
  mindmapStore.setViewport(viewportX.value, viewportY.value, scale.value)
  debouncedUpdate()
}

const zoomOut = () => {
  scale.value = Math.max(0.2, scale.value / 1.2)
  mindmapStore.setViewport(viewportX.value, viewportY.value, scale.value)
  debouncedUpdate()
}

const resetView = () => {
  viewportX.value = 0
  viewportY.value = 0
  scale.value = 1
  mindmapStore.setViewport(0, 0, 1)
  debouncedUpdate()
}

const onNodeDragStart = ({ nodeId, event }) => {
  if (layout.value === LayoutType.OUTLINE) return
  if (nodeId === mindmapStore.mindmap?.rootNodeId) return
  
  isDragging.value = true
  dragData.value = {
    nodeId,
    startX: event.clientX,
    startY: event.clientY,
    originalX: nodes.value[nodeId]?.x || 0,
    originalY: nodes.value[nodeId]?.y || 0
  }
  updateGhostPosition(event)
  document.body.style.cursor = 'grabbing'
  mindmapStore.selectNode(nodeId)
}

const updateGhostPosition = (e) => {
  if (!dragData.value) return
  const rect = canvasContainer.value.getBoundingClientRect()
  const x = (e.clientX - rect.left - viewportX.value) / scale.value
  const y = (e.clientY - rect.top - viewportY.value) / scale.value
  const size = getNodeSize(ghostNode.value?.text || '')
  ghostPosition.value = { x: x - size.width / 2, y: y - size.height / 2 }
}

const getCanvasCoords = (e) => {
  const rect = canvasContainer.value.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left - viewportX.value) / scale.value,
    y: (e.clientY - rect.top - viewportY.value) / scale.value
  }
}

const updateDragIndicator = (e) => {
  if (!dragData.value) return
  const { x: mouseX, y: mouseY } = getCanvasCoords(e)

  if (layout.value === LayoutType.FREE) {
    dragIndicator.visible = false
    return
  }

  let bestTarget = null
  let bestDistance = Infinity
  let bestType = 'child'
  let bestIndex = -1

  visibleNodes.value.forEach(node => {
    if (node.id === dragData.value.nodeId) return
    if (isDescendant(dragData.value.nodeId, node.id)) return
    
    const nodeSize = getNodeSize(node.text)
    const nodeCenter = {
      x: node.x + nodeSize.width / 2,
      y: node.y + nodeSize.height / 2
    }
    const dist = Math.hypot(mouseX - nodeCenter.x, mouseY - nodeCenter.y)
    
    if (dist < 200 && dist < bestDistance) {
      bestDistance = dist
      bestTarget = node
      
      if (node.parentId) {
        const siblings = getSiblingsOrdered(node.parentId)
        const nodeIndex = siblings.findIndex(s => s.id === node.id)
        
        if (layout.value === LayoutType.HORIZONTAL) {
          if (mouseY < node.y + nodeSize.height * 0.35) {
            bestType = 'before'
            bestIndex = nodeIndex
          } else if (mouseY > node.y + nodeSize.height * 0.65) {
            bestType = 'after'
            bestIndex = nodeIndex + 1
          } else {
            bestType = 'child'
          }
        } else if (layout.value === LayoutType.VERTICAL) {
          if (mouseX < node.x + nodeSize.width * 0.35) {
            bestType = 'before'
            bestIndex = nodeIndex
          } else if (mouseX > node.x + nodeSize.width * 0.65) {
            bestType = 'after'
            bestIndex = nodeIndex + 1
          } else {
            bestType = 'child'
          }
        } else {
          bestType = 'child'
        }
      } else {
        bestType = 'child'
      }
    }
  })

  if (bestTarget) {
    const nodeSize = getNodeSize(bestTarget.text)
    
    if (bestType === 'before') {
      dragIndicator.visible = true
      dragIndicator.type = 'before'
      dragIndicator.x = bestTarget.x - 10
      dragIndicator.y = bestTarget.y - 6
      dragIndicator.width = nodeSize.width + 20
      dragIndicator.height = 4
      dragIndicator.targetId = bestTarget.parentId
      dragIndicator.insertIndex = bestIndex
    } else if (bestType === 'after') {
      dragIndicator.visible = true
      dragIndicator.type = 'after'
      dragIndicator.x = bestTarget.x - 10
      dragIndicator.y = bestTarget.y + nodeSize.height + 2
      dragIndicator.width = nodeSize.width + 20
      dragIndicator.height = 4
      dragIndicator.targetId = bestTarget.parentId
      dragIndicator.insertIndex = bestIndex
    } else {
      dragIndicator.visible = true
      dragIndicator.type = 'child'
      dragIndicator.x = bestTarget.x - 6
      dragIndicator.y = bestTarget.y - 6
      dragIndicator.width = nodeSize.width + 12
      dragIndicator.height = nodeSize.height + 12
      dragIndicator.targetId = bestTarget.id
      dragIndicator.insertIndex = -1
    }
  } else {
    dragIndicator.visible = false
    dragIndicator.targetId = null
    dragIndicator.insertIndex = -1
  }
}

const isDescendant = (ancestorId, nodeId) => {
  let current = nodes.value[nodeId]
  while (current) {
    if (current.id === ancestorId) return true
    current = current.parentId ? nodes.value[current.parentId] : null
  }
  return false
}

const finishDrag = (e) => {
  if (!dragData.value) return
  
  const draggedNodeId = dragData.value.nodeId
  
  if (layout.value === LayoutType.FREE) {
    const dx = (e.clientX - dragData.value.startX) / scale.value
    const dy = (e.clientY - dragData.value.startY) / scale.value
    mindmapStore.moveNodePosition(draggedNodeId, dragData.value.originalX + dx, dragData.value.originalY + dy)
  } else if (dragIndicator.targetId) {
    mindmapStore.moveNode(draggedNodeId, dragIndicator.targetId)
  }
  
  isDragging.value = false
  dragData.value = null
  dragIndicator.visible = false
  document.body.style.cursor = ''
}

const onDrop = (e) => {
  e.preventDefault()
}

watch(() => presentationStore.currentIndex, (newIdx, oldIdx) => {
  if (newIdx !== oldIdx && presentationStore.currentNode) {
    const nodeId = presentationStore.currentNode.id
    presentationAnimateNodes.add(nodeId)
    setTimeout(() => {
      presentationAnimateNodes.delete(nodeId)
    }, 500)
  }
})

watch(() => mindmapStore.mindmap?.viewport, (vp) => {
  if (vp) {
    viewportX.value = vp.x
    viewportY.value = vp.y
    scale.value = vp.scale
  }
}, { immediate: true })

onMounted(() => {
  updateContainerSize()
  window.addEventListener('resize', updateContainerSize)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerSize)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})

defineExpose({
  svgRef,
  getSvgElement: () => svgRef.value
})
</script>

<style scoped>
.mindmap-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: var(--bg-primary);
  cursor: grab;
}

.canvas-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform;
}

.canvas-wrapper.presentation-transition {
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.canvas-svg {
  display: block;
  background: var(--bg-primary);
}

.canvas-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-secondary);
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow);
  border: 1px solid var(--border);
  z-index: 10;
}

.control-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: var(--accent);
  color: white;
}

.zoom-level {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 45px;
  text-align: center;
}

.viewport-info {
  position: absolute;
  bottom: 20px;
  left: 20px;
  padding: 6px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.drag-ghost {
  opacity: 0.7;
  pointer-events: none;
  filter: drop-shadow(0 4px 12px var(--shadow));
}

.drag-indicator {
  pointer-events: none;
  z-index: 1000;
}

.drag-indicator line {
  filter: drop-shadow(0 0 4px var(--selected));
}

.drag-indicator rect {
  filter: drop-shadow(0 0 4px var(--selected));
}

.node-enter-active {
  animation: viewport-enter 0.2s ease-out;
}

.node-leave-active {
  animation: viewport-leave 0.15s ease-in;
}

.node-move {
  transition: transform 0.2s ease;
}

@keyframes viewport-enter {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes viewport-leave {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
