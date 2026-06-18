<template>
  <div class="outline-view">
    <div class="outline-header">
      <component :is="FileText" :size="20" />
      <h2>大纲视图</h2>
      <div class="header-actions">
        <button class="action-btn" @click="onCopyAll" title="复制全部">
          <component :is="Copy" :size="16" />
        </button>
        <button class="action-btn" @click="onExport" title="导出 Markdown">
          <component :is="Download" :size="16" />
        </button>
      </div>
    </div>
    <div class="outline-content" ref="contentRef">
      <div
        v-for="item in flatNodes"
        :key="item.node.id"
        class="outline-line"
        :style="{ paddingLeft: item.level * 24 + 16 + 'px' }"
        :class="{ selected: item.node.id === selectedNodeId }"
        @click="onSelectNode(item.node.id)"
        @dblclick="onStartEdit(item.node.id)"
      >
        <span class="bullet" v-if="item.level === 0">{{ level1Index }}.</span>
        <span class="bullet" v-else-if="item.level === 1">{{ getSubIndex(item) }}.</span>
        <span class="bullet" v-else>•</span>
        <span
          class="text"
          :class="{
            'font-bold': item.node.bold,
            'italic': item.node.italic,
            'underline': item.node.underline
          }"
        >
          {{ item.node.text }}
        </span>
        <input
          v-if="editingId === item.node.id"
          ref="editInput"
          v-model="editText"
          type="text"
          class="edit-input"
          @keydown="onEditKeyDown"
          @blur="onEditBlur"
        />
      </div>
    </div>
  </div>
</template>

<script setup>import { ref, computed, nextTick, watch } from 'vue';
import { FileText, Copy, Download } from 'lucide-vue-next';
import { useMindmapStore } from '@/stores/mindmap.js';
import { useHistoryStore } from '@/stores/history.js';
import { exportMarkdown } from '@/utils/io.js';
const mindmapStore = useMindmapStore();
const historyStore = useHistoryStore();
const contentRef = ref(null);
const editInput = ref(null);
const editingId = ref(null);
const editText = ref('');
const selectedNodeId = computed(() => mindmapStore.selectedNodeId);
const flatNodes = computed(() => {
 const result = [];
 const walk = (nodeId, level) => {
 const node = mindmapStore.nodes[nodeId];
 if (!node)
 return;
 result.push({ node, level });
 if (node.expanded !== false) {
 const children = Object.values(mindmapStore.nodes)
 .filter(n => n.parentId === nodeId)
 .sort((a, b) => a.y - b.y);
 children.forEach(child => walk(child.id, level + 1));
 }
 };
 if (mindmapStore.mindmap?.rootNodeId) {
 walk(mindmapStore.mindmap.rootNodeId, 0);
 }
 return result;
});
const level1Index = computed(() => {
 return '1';
});
const getSubIndex = (item) => {
 const siblings = flatNodes.value.filter(n => n.level === 1);
 const idx = siblings.findIndex(s => s.node.id === item.node.id);
 return ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][idx] || (idx + 1);
};
const onSelectNode = (nodeId) => {
 if (editingId.value)
 return;
 mindmapStore.selectNode(nodeId);
};
const onStartEdit = (nodeId) => {
 editingId.value = nodeId;
 const node = mindmapStore.nodes[nodeId];
 editText.value = node?.text || '';
 nextTick(() => {
 if (editInput.value) {
 editInput.value.focus();
 editInput.value.select();
 }
 });
};
const onEditKeyDown = (e) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 finishEdit();
 }
 else if (e.key === 'Escape') {
 e.preventDefault();
 cancelEdit();
 }
};
const onEditBlur = () => {
 if (editText.value !== mindmapStore.nodes[editingId.value]?.text) {
 finishEdit();
 }
 else {
 cancelEdit();
 }
};
const finishEdit = () => {
 if (editingId.value && editText.value) {
 historyStore.saveState();
 mindmapStore.updateNode(editingId.value, { text: editText.value });
 }
 editingId.value = null;
};
const cancelEdit = () => {
 editingId.value = null;
};
const onCopyAll = () => {
 const text = flatNodes.value
 .map(item => ' '.repeat(item.level * 2) + item.node.text)
 .join('\n');
 navigator.clipboard.writeText(text);
};
const onExport = () => {
 exportMarkdown(mindmapStore.mindmap);
};
watch(editingId, (val) => {
 if (val) {
 nextTick(() => editInput.value?.focus());
 }
});
</script>

<style scoped>
.outline-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.outline-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-secondary);
}

.outline-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
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

.action-btn:hover {
  background: var(--accent);
  color: white;
}

.outline-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.outline-content::-webkit-scrollbar {
  width: 8px;
}

.outline-content::-webkit-scrollbar-track {
  background: transparent;
}

.outline-content::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}

.outline-line {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.15s ease;
  position: relative;
}

.outline-line:hover {
  background: var(--bg-secondary);
}

.outline-line.selected {
  background: var(--bg-tertiary);
}

.outline-line.selected::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--accent);
}

.bullet {
  color: var(--text-muted);
  font-size: 14px;
  min-width: 20px;
  font-family: serif;
}

.text {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
}

.italic {
  font-style: italic;
}

.underline {
  text-decoration: underline;
}

.edit-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--accent);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}
</style>
