<template>
  <g
    class="mindmap-node"
    :class="{
      'is-selected': isSelected,
      'is-editing': isEditing,
      'is-collapsed': !node.expanded && hasChildren,
      'is-presentation': isPresentation,
      'presentation-animate': presentationAnimate
    }"
    :transform="`translate(${pos.x}, ${pos.y})`"
    @mousedown.stop="onMouseDown"
    @dblclick.stop="onDoubleClick"
  >
    <g class="node-inner">
      <path
        :d="shapePath"
        class="node-shape"
        :fill="node.color || 'var(--node-bg)'"
        :stroke="isSelected ? 'var(--selected)' : 'var(--node-border)'"
        :stroke-width="isSelected ? 3 : 2"
      />
      
      <foreignObject
        :x="icon ? 28 : 8"
        :y="4"
        :width="size.width - (icon ? 36 : 16)"
        :height="size.height - 8"
      >
        <div
          v-if="isEditing"
          class="node-editor"
        >
          <input
            ref="inputRef"
            v-model="editText"
            type="text"
            class="node-input"
            :style="textStyle"
            @keydown="onKeyDown"
            @blur="onBlur"
          />
        </div>
        <div
          v-else
          class="node-content"
          :style="textStyle"
        >
          {{ node.text }}
        </div>
      </foreignObject>

      <foreignObject
        v-if="icon"
        x="6"
        y="10"
        width="20"
        height="20"
      >
        <div class="node-icon">
          <component :is="iconComponent" :size="18" :stroke-width="2" />
        </div>
      </foreignObject>

      <g
        v-if="hasChildren"
        class="expand-toggle"
        :transform="`translate(${size.width - 10}, ${size.height / 2})`"
        @click.stop="onToggleExpand"
      >
        <circle cx="0" cy="0" r="10" fill="var(--accent)" />
        <path
          :d="node.expanded ? 'M-4,0 L4,0 M0,-4 L0,0' : 'M-4,0 L4,0 M0,-4 L0,4'"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
        />
      </g>

      <g
        v-if="isPresentation"
        class="presentation-ring"
      >
        <circle
          :cx="size.width / 2"
          :cy="size.height / 2"
          :r="Math.max(size.width, size.height) / 2 + 12"
          fill="none"
          stroke="var(--accent)"
          stroke-width="3"
          class="ring-outer"
        />
        <circle
          :cx="size.width / 2"
          :cy="size.height / 2"
          :r="Math.max(size.width, size.height) / 2 + 6"
          fill="none"
          stroke="var(--accent)"
          stroke-width="2"
          class="ring-inner"
        />
      </g>
    </g>
  </g>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import * as LucideIcons from 'lucide-vue-next'
import { getNodeSize } from '@/utils/helpers.js'

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  pos: {
    type: Object,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  isPresentation: {
    type: Boolean,
    default: false
  },
  presentationAnimate: {
    type: Boolean,
    default: false
  },
  hasChildren: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select', 'edit-start', 'edit-end', 'toggle-expand', 'drag-start'])

const inputRef = ref(null)
const editText = ref(props.node.text)

const size = computed(() => getNodeSize(props.node.text))
const icon = computed(() => props.node.icon)
const iconComponent = computed(() => {
  if (!icon.value) return null
  return LucideIcons[icon.value] || null
})

const shapePath = computed(() => {
  const w = size.value.width
  const h = size.value.height
  const r = 10
  switch (props.node.shape) {
    case 'rect':
      return `M0,0 L${w},0 L${w},${h} L0,${h} Z`
    case 'roundRect':
      return `M${r},0 L${w - r},0 Q${w},0 ${w},${r} L${w},${h - r} Q${w},${h} ${w - r},${h} L${r},${h} Q0,${h} 0,${h - r} L0,${r} Q0,0 ${r},0 Z`
    case 'ellipse':
      return `M0,${h / 2} Q0,0 ${w / 2},0 Q${w},0 ${w},${h / 2} Q${w},${h} ${w / 2},${h} Q0,${h} 0,${h / 2} Z`
    case 'diamond':
      return `M${w / 2},0 L${w},${h / 2} L${w / 2},${h} L0,${h / 2} Z`
    case 'parallelogram':
      const skew = 15
      return `M${skew},0 L${w},0 L${w - skew},${h} L0,${h} Z`
    default:
      return `M${r},0 L${w - r},0 Q${w},0 ${w},${r} L${w},${h - r} Q${w},${h} ${w - r},${h} L${r},${h} Q0,${h} 0,${h - r} L0,${r} Q0,0 ${r},0 Z`
  }
})

const textStyle = computed(() => ({
  fontWeight: props.node.bold ? 'bold' : 'normal',
  fontStyle: props.node.italic ? 'italic' : 'normal',
  textDecoration: props.node.underline ? 'underline' : 'none',
  color: 'var(--node-text)'
}))

watch(() => props.isEditing, (val) => {
  if (val) {
    editText.value = props.node.text
    nextTick(() => {
      if (inputRef.value) {
        inputRef.value.focus()
        inputRef.value.select()
      }
    })
  }
})

const onMouseDown = (e) => {
  if (props.isEditing) return
  emit('select', props.node.id)
  emit('drag-start', { nodeId: props.node.id, event: e })
}

const onDoubleClick = () => {
  emit('edit-start', props.node.id)
}

const onToggleExpand = () => {
  emit('toggle-expand', props.node.id)
}

const onKeyDown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    emit('edit-end', { nodeId: props.node.id, text: editText.value, action: 'enter' })
  } else if (e.key === 'Escape') {
    e.preventDefault()
    emit('edit-end', { nodeId: props.node.id, text: null, action: 'cancel' })
  }
}

const onBlur = () => {
  if (editText.value !== props.node.text) {
    emit('edit-end', { nodeId: props.node.id, text: editText.value, action: 'blur' })
  } else {
    emit('edit-end', { nodeId: props.node.id, text: null, action: 'cancel' })
  }
}

defineExpose({
  getSize: () => size.value
})
</script>

<style scoped>
.mindmap-node {
  cursor: pointer;
  transform-box: fill-box;
  transform-origin: center center;
}

.mindmap-node:hover {
  filter: brightness(1.05);
}

.node-inner {
  transform-origin: center center;
}

.node-shape {
  filter: drop-shadow(0 2px 4px var(--shadow));
  transition: stroke 0.2s ease, stroke-width 0.2s ease;
}

.is-selected .node-shape {
  stroke: var(--selected);
  filter: drop-shadow(0 2px 8px var(--shadow));
}

.is-presentation .node-shape {
  filter: drop-shadow(0 0 16px var(--accent));
}

.presentation-animate .node-inner {
  animation: presentation-enter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes presentation-enter {
  0% {
    opacity: 0;
    transform: scale(0.3) rotate(-10deg);
  }
  60% {
    transform: scale(1.15) rotate(2deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

.presentation-ring .ring-outer {
  animation: ring-pulse 2s ease-in-out infinite;
  transform-origin: center;
}

.presentation-ring .ring-inner {
  animation: ring-pulse 2s ease-in-out infinite 0.5s;
  transform-origin: center;
}

@keyframes ring-pulse {
  0%, 100% {
    opacity: 0.8;
    transform-origin: center;
  }
  50% {
    opacity: 0.2;
    transform-origin: center;
  }
}

.node-content,
.node-editor {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: none;
}

.node-input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  text-align: center;
  color: var(--node-text);
}

.node-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.expand-toggle {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.expand-toggle:hover {
  transform: translate(8px, -50%) scale(1.15);
}

.is-collapsed .node-shape {
  stroke-dasharray: 6, 3;
}
</style>
