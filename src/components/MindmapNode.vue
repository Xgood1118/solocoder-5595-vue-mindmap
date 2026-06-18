<template>
  <g
    class="mindmap-node"
    :class="{
      'is-selected': isSelected,
      'is-editing': isEditing,
      'is-collapsed': !node.expanded && hasChildren,
      'is-presentation': isPresentation
    }"
    :transform="`translate(${pos.x}, ${pos.y})`"
    @mousedown.stop="onMouseDown"
    @dblclick.stop="onDoubleClick"
  >
    <path
      :d="shapePath"
      class="node-shape"
      :fill="node.color || 'var(--node-bg)'"
      :stroke="isSelected ? 'var(--selected)' : 'var(--node-border)'"
      stroke-width="2"
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
      <circle cx="0" cy="0" r="8" fill="var(--accent)" />
      <path
        :d="node.expanded ? 'M-3,0 L3,0 M0,-3 L0,0' : 'M-3,0 L3,0 M0,-3 L0,3'"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
      />
    </g>
  </g>
</template>

<script setup>import { ref, computed, nextTick, watch } from 'vue';
import * as LucideIcons from 'lucide-vue-next';
import { getNodeSize } from '@/utils/helpers.js';
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
 hasChildren: {
 type: Boolean,
 default: false
 }
});
const emit = defineEmits(['select', 'edit-start', 'edit-end', 'toggle-expand', 'drag-start']);
const inputRef = ref(null);
const editText = ref(props.node.text);
const size = computed(() => getNodeSize(props.node.text));
const icon = computed(() => props.node.icon);
const iconComponent = computed(() => {
 if (!icon.value)
 return null;
 return LucideIcons[icon.value] || null;
});
const shapePath = computed(() => {
 const w = size.value.width;
 const h = size.value.height;
 const r = 8;
 switch (props.node.shape) {
 case 'rect':
 return `M0,0 L${w},0 L${w},${h} L0,${h} Z`;
 case 'roundRect':
 return `M${r},0 L${w - r},0 Q${w},0 ${w},${r} L${w},${h - r} Q${w},${h} ${w - r},${h} L${r},${h} Q0,${h} 0,${h - r} L0,${r} Q0,0 ${r},0 Z`;
 case 'ellipse':
 return `M0,${h / 2} Q0,0 ${w / 2},0 Q${w},0 ${w},${h / 2} Q${w},${h} ${w / 2},${h} Q0,${h} 0,${h / 2} Z`;
 case 'diamond':
 return `M${w / 2},0 L${w},${h / 2} L${w / 2},${h} L0,${h / 2} Z`;
 case 'parallelogram':
 const skew = 15;
 return `M${skew},0 L${w},0 L${w - skew},${h} L0,${h} Z`;
 default:
 return `M${r},0 L${w - r},0 Q${w},0 ${w},${r} L${w},${h - r} Q${w},${h} ${w - r},${h} L${r},${h} Q0,${h} 0,${h - r} L0,${r} Q0,0 ${r},0 Z`;
 }
});
const textStyle = computed(() => {
 return {
 fontWeight: props.node.bold ? 'bold' : 'normal',
 fontStyle: props.node.italic ? 'italic' : 'normal',
 textDecoration: props.node.underline ? 'underline' : 'none',
 color: 'var(--node-text)'
 };
});
watch(() => props.isEditing, (val) => {
 if (val) {
 editText.value = props.node.text;
 nextTick(() => {
 if (inputRef.value) {
 inputRef.value.focus();
 inputRef.value.select();
 }
 });
 }
});
const onMouseDown = (e) => {
 if (props.isEditing)
 return;
 emit('select', props.node.id);
 emit('drag-start', { nodeId: props.node.id, event: e });
};
const onDoubleClick = () => {
 emit('edit-start', props.node.id);
};
const onToggleExpand = () => {
 emit('toggle-expand', props.node.id);
};
const onKeyDown = (e) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 emit('edit-end', { nodeId: props.node.id, text: editText.value, action: 'enter' });
 }
 else if (e.key === 'Escape') {
 e.preventDefault();
 emit('edit-end', { nodeId: props.node.id, text: null, action: 'cancel' });
 }
};
const onBlur = () => {
 if (editText.value !== props.node.text) {
 emit('edit-end', { nodeId: props.node.id, text: editText.value, action: 'blur' });
 }
 else {
 emit('edit-end', { nodeId: props.node.id, text: null, action: 'cancel' });
 }
};
defineExpose({
 getSize: () => size.value
});
</script>

<style scoped>
.mindmap-node {
  cursor: pointer;
  transition: transform 0.15s ease;
}

.mindmap-node:hover {
  filter: brightness(1.05);
}

.node-shape {
  filter: drop-shadow(0 2px 4px var(--shadow));
  transition: stroke 0.2s ease;
}

.is-selected .node-shape {
  stroke: var(--selected);
  stroke-width: 3;
}

.is-presentation .node-shape {
  animation: presentation-pulse 2s ease-in-out infinite;
}

@keyframes presentation-pulse {
  0%, 100% { filter: drop-shadow(0 0 8px var(--accent)); }
  50% { filter: drop-shadow(0 0 20px var(--accent)); }
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
  transform: translate(calc(100% - 10px), -50%) scale(1.1);
}

.node-enter-active {
  animation: node-in 0.3s ease-out;
}

@keyframes node-in {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
