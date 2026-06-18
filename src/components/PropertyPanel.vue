<template>
  <div class="property-panel">
    <div class="panel-header">
      <component :is="Settings" :size="18" />
      <span>节点属性</span>
    </div>
    
    <div v-if="selectedNode" class="panel-content">
      <div class="property-group">
        <label class="property-label">节点文本</label>
        <input
          type="text"
          :value="selectedNode.text"
          class="property-input"
          @input="onTextChange"
        />
      </div>

      <div class="property-group">
        <label class="property-label">节点形状</label>
        <div class="shape-options">
          <button
            v-for="shape in shapeOptions"
            :key="shape.value"
            class="shape-btn"
            :class="{ active: selectedNode.shape === shape.value }"
            :title="shape.label"
            @click="onShapeChange(shape.value)"
          >
            <svg width="32" height="24" viewBox="0 0 32 24">
              <path :d="getShapePath(shape.value)" fill="none" stroke="currentColor" stroke-width="2" />
            </svg>
          </button>
        </div>
      </div>

      <div class="property-group">
        <label class="property-label">节点图标</label>
        <div class="icon-options">
          <button
            class="icon-btn"
            :class="{ active: !selectedNode.icon }"
            @click="onIconChange(null)"
          >
            <component :is="X" :size="16" />
          </button>
          <button
            v-for="icon in iconOptions"
            :key="icon"
            class="icon-btn"
            :class="{ active: selectedNode.icon === icon }"
            @click="onIconChange(icon)"
          >
            <component :is="getIconComponent(icon)" :size="16" />
          </button>
        </div>
      </div>

      <div class="property-group">
        <label class="property-label">文本样式</label>
        <div class="style-options">
          <button
            class="style-btn"
            :class="{ active: selectedNode.bold }"
            @click="onToggleStyle('bold')"
          >
            <strong>B</strong>
          </button>
          <button
            class="style-btn"
            :class="{ active: selectedNode.italic }"
            @click="onToggleStyle('italic')"
          >
            <em>I</em>
          </button>
          <button
            class="style-btn"
            :class="{ active: selectedNode.underline }"
            @click="onToggleStyle('underline')"
          >
            <u>U</u>
          </button>
        </div>
      </div>

      <div class="property-group">
        <label class="property-label">节点颜色</label>
        <div class="color-options">
          <button
            v-for="color in colorOptions"
            :key="color.value"
            class="color-btn"
            :class="{ active: selectedNode.color === color.value }"
            :style="{ background: color.value }"
            :title="color.label"
            @click="onColorChange(color.value)"
          />
          <button
            class="color-btn default"
            :class="{ active: !selectedNode.color }"
            title="默认"
            @click="onColorChange(null)"
          />
        </div>
      </div>

      <div class="property-group">
        <div class="node-stats">
          <span>子节点: {{ childCount }}</span>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <component :is="MousePointer" :size="32" />
      <p>选择一个节点以编辑属性</p>
    </div>
  </div>
</template>

<script setup>import { computed } from 'vue';
import { Settings, X, MousePointer, Star, Flag, Heart, Check, Circle, Square, Triangle, Lightbulb, Sparkles, Target, Calendar, Clock, User, Users, File, Folder, Link, Tag, Layers } from 'lucide-vue-next';
import { useMindmapStore } from '@/stores/mindmap.js';
import { useHistoryStore } from '@/stores/history.js';
import * as LucideIcons from 'lucide-vue-next';
const mindmapStore = useMindmapStore();
const historyStore = useHistoryStore();
const selectedNode = computed(() => mindmapStore.selectedNode);
const childCount = computed(() => {
 if (!selectedNode.value)
 return 0;
 return Object.values(mindmapStore.nodes).filter(n => n.parentId === selectedNode.value.id).length;
});
const shapeOptions = [
 { label: '矩形', value: 'rect' },
 { label: '圆角矩形', value: 'roundRect' },
 { label: '椭圆', value: 'ellipse' },
 { label: '菱形', value: 'diamond' },
 { label: '平行四边形', value: 'parallelogram' }
];
const iconOptions = [
 'Star', 'Flag', 'Heart', 'Check', 'Circle', 'Square', 'Triangle',
 'Lightbulb', 'Sparkles', 'Target', 'Calendar', 'Clock', 'User', 'Users',
 'File', 'Folder', 'Link', 'Tag', 'Layers'
];
const colorOptions = [
 { label: '红色', value: '#fecaca' },
 { label: '橙色', value: '#fed7aa' },
 { label: '黄色', value: '#fef08a' },
 { label: '绿色', value: '#bbf7d0' },
 { label: '蓝色', value: '#bfdbfe' },
 { label: '紫色', value: '#ddd6fe' },
 { label: '粉色', value: '#fbcfe8' }
];
const getShapePath = (shape) => {
 switch (shape) {
 case 'rect':
 return 'M2,2 L30,2 L30,22 L2,22 Z';
 case 'roundRect':
 return 'M8,2 L24,2 Q30,2 30,8 L30,16 Q30,22 24,22 L8,22 Q2,22 2,16 L2,8 Q2,2 8,2 Z';
 case 'ellipse':
 return 'M2,12 Q2,2 16,2 Q30,2 30,12 Q30,22 16,22 Q2,22 2,12 Z';
 case 'diamond':
 return 'M16,2 L30,12 L16,22 L2,12 Z';
 case 'parallelogram':
 return 'M8,2 L30,2 L24,22 L2,22 Z';
 default:
 return '';
 }
};
const getIconComponent = (icon) => {
 return LucideIcons[icon] || null;
};
const onTextChange = (e) => {
 historyStore.saveState();
 mindmapStore.updateNode(selectedNode.value.id, { text: e.target.value });
};
const onShapeChange = (shape) => {
 historyStore.saveState();
 mindmapStore.updateNode(selectedNode.value.id, { shape });
};
const onIconChange = (icon) => {
 historyStore.saveState();
 mindmapStore.updateNode(selectedNode.value.id, { icon });
};
const onToggleStyle = (style) => {
 historyStore.saveState();
 mindmapStore.updateNode(selectedNode.value.id, { [style]: !selectedNode.value[style] });
};
const onColorChange = (color) => {
 historyStore.saveState();
 mindmapStore.updateNode(selectedNode.value.id, { color });
};
</script>

<style scoped>
.property-panel {
  width: 280px;
  height: 100%;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border);
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

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}

.property-group {
  margin-bottom: 20px;
}

.property-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.property-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s ease;
}

.property-input:focus {
  border-color: var(--accent);
}

.shape-options,
.icon-options,
.style-options,
.color-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.shape-btn,
.icon-btn,
.style-btn {
  width: 40px;
  height: 32px;
  border: 1px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-primary);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  font-size: 14px;
  font-weight: 600;
}

.shape-btn:hover,
.icon-btn:hover,
.style-btn:hover {
  border-color: var(--accent);
}

.shape-btn.active,
.icon-btn.active,
.style-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.color-btn {
  width: 28px;
  height: 28px;
  border: 2px solid var(--border);
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent);
}

.color-btn.default {
  background: var(--node-bg);
}

.node-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 6px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted);
  padding: 32px;
  text-align: center;
}

.empty-state p {
  font-size: 13px;
  margin: 0;
}
</style>
