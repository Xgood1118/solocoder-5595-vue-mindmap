<template>
  <div class="outline-panel">
    <div class="panel-header">
      <component :is="List" :size="18" />
      <span>大纲视图</span>
    </div>
    <div class="outline-tree">
      <OutlineItem
        v-if="rootNode"
        :node="rootNode"
        :level="0"
        :nodes="nodes"
        :selected-id="selectedNodeId"
        @select="onSelectNode"
        @toggle="onToggleExpand"
      />
    </div>
  </div>
</template>

<script setup>import { computed } from 'vue';
import { List } from 'lucide-vue-next';
import { useMindmapStore } from '@/stores/mindmap.js';
import OutlineItem from './OutlineItem.vue';
const mindmapStore = useMindmapStore();
const nodes = computed(() => mindmapStore.nodes);
const rootNode = computed(() => mindmapStore.rootNode);
const selectedNodeId = computed(() => mindmapStore.selectedNodeId);
const onSelectNode = (nodeId) => {
 mindmapStore.selectNode(nodeId);
};
const onToggleExpand = (nodeId) => {
 mindmapStore.toggleNodeExpand(nodeId);
};
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
</style>
