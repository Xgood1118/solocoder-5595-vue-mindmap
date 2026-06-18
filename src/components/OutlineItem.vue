<template>
  <div class="outline-item" :style="{ paddingLeft: level * 16 + 8 + 'px' }">
    <div
      class="item-row"
      :class="{ selected: node.id === selectedId }"
      @click="$emit('select', node.id)"
      @dblclick="$emit('toggle', node.id)"
    >
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
    </div>
    
    <div v-if="node.expanded && children.length > 0" class="children">
      <OutlineItem
        v-for="child in children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :nodes="nodes"
        :selected-id="selectedId"
        @select="(id) => $emit('select', id)"
        @toggle="(id) => $emit('toggle', id)"
      />
    </div>
  </div>
</template>

<script setup>import { computed } from 'vue';
import { ChevronDown, ChevronRight } from 'lucide-vue-next';
import * as LucideIcons from 'lucide-vue-next';
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
 }
});
defineEmits(['select', 'toggle']);
const children = computed(() => {
 return Object.values(props.nodes).filter(n => n.parentId === props.node.id);
});
const hasChildren = computed(() => children.value.length > 0);
const iconComponent = computed(() => {
 if (!props.node.icon)
 return null;
 return LucideIcons[props.node.icon] || null;
});
</script>

<style scoped>
.outline-item {
  user-select: none;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.item-row:hover {
  background: var(--bg-tertiary);
}

.item-row.selected {
  background: var(--accent);
  color: white;
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

.children {
  overflow: hidden;
}
</style>
