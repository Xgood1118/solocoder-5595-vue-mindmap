<template>
  <div class="outline-panel">
    <div class="panel-header">
      <component :is="List" :size="18" />
      <span>大纲视图</span>
      <span class="node-count">{{ visibleCount }} 节点</span>
    </div>
    <div
      ref="outlineTree"
      class="outline-tree"
      @dragover.prevent
    >
      <OutlineItem
        v-if="rootNode"
        :node="rootNode"
        :level="0"
        :nodes="nodes"
        :selected-id="selectedNodeId"
        :dragging-id="draggingNodeId"
        @select="onSelectNode"
        @toggle="onToggleExpand"
        @drag-start="onItemDragStart"
        @drag-end="onItemDragEnd"
        @drop-node="onNodeDropped"
      />
    </div>

    <div v-if="draggingNodeId" class="drag-hint">
      <component :is="Info" :size="14" />
      <span>拖到节点上/下方可排序，拖到节点中间变为子节点</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { List, Info } from 'lucide-vue-next'
import { useMindmapStore } from '@/stores/mindmap.js'
import OutlineItem from './OutlineItem.vue'

const mindmapStore = useMindmapStore()

const outlineTree = ref(null)
const draggingNodeId = ref(null)

const nodes = computed(() => mindmapStore.nodes)
const rootNode = computed(() => mindmapStore.rootNode)
const selectedNodeId = computed(() => mindmapStore.selectedNodeId)

const visibleCount = computed(() => {
  return Object.values(nodes.value).filter(n => {
    if (!n.parentId) return true
    const parent = nodes.value[n.parentId]
    return parent && parent.expanded !== false
  }).length
})

const onSelectNode = (nodeId) => {
  mindmapStore.selectNode(nodeId)
}

const onToggleExpand = (nodeId) => {
  mindmapStore.toggleNodeExpand(nodeId)
}

const onItemDragStart = (nodeId) => {
  draggingNodeId.value = nodeId
}

const onItemDragEnd = () => {
  draggingNodeId.value = null
}

const onNodeDropped = ({ draggedId, targetId, position }) => {
  if (!draggedId || !targetId || draggedId === targetId) return
  
  let targetParentId = null
  if (position === 'inside') {
    targetParentId = targetId
  } else {
    const targetNode = nodes.value[targetId]
    if (targetNode) {
      targetParentId = targetNode.parentId || mindmapStore.mindmap?.rootNodeId
    }
  }
  
  if (!targetParentId) return
  if (draggedId === targetParentId) return
  
  let current = nodes.value[targetParentId]
  while (current) {
    if (current.id === draggedId) return
    current = current.parentId ? nodes.value[current.parentId] : null
  }
  
  mindmapStore.moveNode(draggedId, targetParentId)
  draggingNodeId.value = null
}
</script>

<style scoped>
.outline-panel {
  width: 280px;
  height: 100%;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border);
  background: var(--bg-tertiary);
}

.node-count {
  margin-left: auto;
  font-size: 11px;
  font-weight: 400;
  color: var(--text-muted);
  background: var(--bg-primary);
  padding: 2px 8px;
  border-radius: 10px;
}

.outline-tree {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.outline-tree::-webkit-scrollbar {
  width: 6px;
}

.outline-tree::-webkit-scrollbar-track {
  background: transparent;
}

.outline-tree::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}

.drag-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: var(--accent);
  color: white;
  font-size: 11px;
  line-height: 1.4;
  animation: slide-up 0.2s ease;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
