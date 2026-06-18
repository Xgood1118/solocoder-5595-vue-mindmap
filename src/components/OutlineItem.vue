<template>
  <div
    class="outline-item"
    :data-id="node.id"
  >
    <div
      class="item-container"
      :style="{ paddingLeft: level * 16 + 8 + 'px' }"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div
        class="item-row"
        :class="{ selected: node.id === selectedId, dragging: node.id === draggingId }"
        @click="$emit('select', node.id)"
        @dblclick="$emit('toggle', node.id)"
      >
        <div
          class="drag-handle"
          draggable="true"
          @dragstart="onDragStart"
          @dragend="onDragEnd"
        >
          <component :is="GripVertical" :size="14" />
        </div>

        <button
          v-if="hasChildren"
          class="expand-btn"
          @click.stop="$emit('toggle', node.id)"
        >
          <component :is="node.expanded ? ChevronDown : ChevronRight" :size="14" />
        </button>
        <span v-else class="expand-placeholder" />
        
        <div v-if="node.icon" class="item-icon">
          <component :is="iconComponent" :size="14" />
        </div>
        
        <span
          class="item-text"
          :class="{
            'font-bold': node.bold,
            'italic': node.italic,
            'underline': node.underline
          }"
        >
          {{ node.text }}
        </span>

        <span v-if="childrenCount > 0" class="child-count">
          {{ childrenCount }}
        </span>
      </div>

      <div
        v-if="showIndicator"
        class="drop-indicator"
        :class="indicatorPosition"
      />
    </div>

    <template v-if="node.expanded && children.length > 0">
      <OutlineItem
        v-for="child in children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :nodes="nodes"
        :selected-id="selectedId"
        :dragging-id="draggingId"
        @select="(id) => $emit('select', id)"
        @toggle="(id) => $emit('toggle', id)"
        @drag-start="(id) => $emit('drag-start', id)"
        @drag-end="() => $emit('drag-end')"
        @drop-node="(data) => $emit('drop-node', data)"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-vue-next'
import * as LucideIcons from 'lucide-vue-next'
import { useMindmapStore } from '@/stores/mindmap.js'
import { useHistoryStore } from '@/stores/history.js'

const mindmapStore = useMindmapStore()
const historyStore = useHistoryStore()

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 0
  },
  nodes: {
    type: Object,
    required: true
  },
  selectedId: {
    type: String,
    default: null
  },
  draggingId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['select', 'toggle', 'drag-start', 'drag-end', 'drop-node'])

const showIndicator = ref(false)
const indicatorPosition = ref('before')

const children = computed(() => {
  return Object.values(props.nodes).filter(n => n.parentId === props.node.id)
})

const childrenCount = computed(() => children.value.length)

const hasChildren = computed(() => children.value.length > 0)

const iconComponent = computed(() => {
  if (!props.node.icon) return null
  return LucideIcons[props.node.icon] || null
})

const onDragStart = (e) => {
  if (e && e.dataTransfer) {
    e.dataTransfer.setData('text/plain', props.node.id)
    e.dataTransfer.effectAllowed = 'move'
  }
  e.stopPropagation()
  emit('drag-start', props.node.id)
}

const onDragEnd = () => {
  showIndicator.value = false
  emit('drag-end')
}

const onDragOver = (e) => {
  if (!props.draggingId || props.draggingId === props.node.id) return
  
  const rect = e.currentTarget.getBoundingClientRect()
  const y = e.clientY - rect.top
  const height = rect.height
  
  showIndicator.value = true
  if (y < height * 0.35) {
    indicatorPosition.value = 'before'
  } else if (y > height * 0.65) {
    indicatorPosition.value = 'after'
  } else {
    indicatorPosition.value = 'inside'
  }
  e.stopPropagation()
}

const onDragLeave = (e) => {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    showIndicator.value = false
  }
}

const onDrop = (e) => {
  e.preventDefault()
  e.stopPropagation()
  const draggedId = e.dataTransfer?.getData('text/plain')
  showIndicator.value = false
  
  if (!draggedId || draggedId === props.node.id) return
  
  let current = props.nodes[props.node.id]
  while (current) {
    if (current.id === draggedId) return
    current = current.parentId ? props.nodes[current.parentId] : null
  }
  
  historyStore.saveState()
  emit('drop-node', {
    draggedId,
    targetId: props.node.id,
    position: indicatorPosition.value
  })
  emit('drag-end')
}
</script>

<style scoped>
.outline-item {
  user-select: none;
}

.item-container {
  position: relative;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s ease;
  position: relative;
}

.item-row:hover {
  background: var(--bg-tertiary);
}

.item-row.selected {
  background: var(--accent);
  color: white;
}

.item-row.dragging {
  opacity: 0.5;
}

.drag-handle {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  color: var(--text-muted);
  border-radius: 3px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s ease, background 0.15s ease;
}

.item-row:hover .drag-handle {
  opacity: 1;
}

.drag-handle:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.drag-handle:active {
  cursor: grabbing;
}

.expand-btn {
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  flex-shrink: 0;
}

.expand-btn:hover {
  background: var(--bg-primary);
}

.item-row.selected .expand-btn {
  color: white;
}

.expand-placeholder {
  width: 18px;
  flex-shrink: 0;
}

.item-icon {
  display: flex;
  align-items: center;
  color: var(--accent);
  flex-shrink: 0;
}

.item-row.selected .item-icon {
  color: white;
}

.item-text {
  flex: 1;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary);
}

.item-row.selected .item-text {
  color: white;
}

.italic {
  font-style: italic;
}

.underline {
  text-decoration: underline;
}

.child-count {
  font-size: 10px;
  padding: 1px 6px;
  background: var(--bg-tertiary);
  border-radius: 10px;
  color: var(--text-secondary);
}

.item-row.selected .child-count {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.drop-indicator {
  position: absolute;
  left: 8px;
  right: 8px;
  height: 3px;
  background: var(--accent);
  border-radius: 2px;
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 0 6px var(--accent);
}

.drop-indicator.before {
  top: 2px;
}

.drop-indicator.after {
  bottom: 2px;
}

.drop-indicator.inside {
  top: 50%;
  transform: translateY(-50%);
  left: 50%;
  right: auto;
  width: calc(100% - 40px);
  height: calc(100% - 4px);
  background: transparent;
  border: 2px dashed var(--accent);
  border-radius: 4px;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
</style>
