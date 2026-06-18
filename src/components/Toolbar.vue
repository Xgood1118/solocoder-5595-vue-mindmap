<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <input
        v-model="title"
        type="text"
        class="title-input"
        @change="onTitleChange"
      />
    </div>

    <div class="toolbar-center">
      <div class="tool-group">
        <button class="tool-btn" @click="onUndo" :disabled="!canUndo">
          <component :is="Undo2" :size="18" />
          <span class="tooltip">撤销 (Ctrl+Z)</span>
        </button>
        <button class="tool-btn" @click="onRedo" :disabled="!canRedo">
          <component :is="Redo2" :size="18" />
          <span class="tooltip">重做 (Ctrl+Y)</span>
        </button>
      </div>

      <div class="divider" />

      <div class="tool-group">
        <button class="tool-btn" @click="onAddChild" :disabled="!hasSelection">
          <component :is="ChevronRight" :size="18" />
          <span class="tooltip">添加子节点 (Tab)</span>
        </button>
        <button class="tool-btn" @click="onAddSibling" :disabled="!hasSelection || isRootSelected">
          <component :is="Plus" :size="18" />
          <span class="tooltip">添加兄弟节点 (Enter)</span>
        </button>
        <button class="tool-btn danger" @click="onDelete" :disabled="!hasSelection || isRootSelected">
          <component :is="Trash2" :size="18" />
          <span class="tooltip">删除节点 (Delete)</span>
        </button>
      </div>

      <div class="divider" />

      <div class="tool-group">
        <button
          class="tool-btn"
          :class="{ active: isBold }"
          @click="onToggleBold"
          :disabled="!hasSelection"
        >
          <strong>B</strong>
          <span class="tooltip">加粗 (Ctrl+B)</span>
        </button>
        <button
          class="tool-btn"
          :class="{ active: isItalic }"
          @click="onToggleItalic"
          :disabled="!hasSelection"
        >
          <em>I</em>
          <span class="tooltip">斜体 (Ctrl+I)</span>
        </button>
        <button
          class="tool-btn"
          :class="{ active: isUnderline }"
          @click="onToggleUnderline"
          :disabled="!hasSelection"
        >
          <u>U</u>
          <span class="tooltip">下划线 (Ctrl+U)</span>
        </button>
      </div>

      <div class="divider" />

      <div class="tool-group">
        <label class="layout-label">布局:</label>
        <select v-model="currentLayout" @change="onLayoutChange" class="layout-select">
          <option value="horizontal">水平</option>
          <option value="vertical">垂直</option>
          <option value="radial">径向</option>
          <option value="free">自由</option>
          <option value="outline">大纲</option>
        </select>
      </div>

      <div class="divider" />

      <div class="tool-group">
        <label class="layout-label">主题:</label>
        <select v-model="currentTheme" @change="onThemeChange" class="layout-select">
          <option value="classic">经典白</option>
          <option value="dark">暗黑</option>
          <option value="eye-care">护眼绿</option>
          <option value="ocean">海洋蓝</option>
          <option value="sunset">日落橙</option>
        </select>
      </div>
    </div>

    <div class="toolbar-right">
      <button class="tool-btn" @click="onStartPresentation">
        <component :is="Play" :size="18" />
        <span class="tooltip">演示模式</span>
      </button>

      <div class="divider" />

      <div class="tool-group">
        <button class="tool-btn" @click="onImport">
          <component :is="Upload" :size="18" />
          <span class="tooltip">导入</span>
        </button>
        <div class="export-menu" ref="exportMenu">
          <button class="tool-btn" @click="toggleExportMenu">
            <component :is="Download" :size="18" />
            <span class="tooltip">导出</span>
          </button>
          <div v-if="showExportMenu" class="export-dropdown">
            <button @click="onExportJSON">JSON</button>
            <button @click="onExportMarkdown">Markdown</button>
            <button @click="onExportOPML">OPML</button>
            <button @click="onExportFreeMind">FreeMind</button>
            <button @click="onExportSVG">SVG</button>
            <button @click="onExportPNG">PNG</button>
          </div>
        </div>
      </div>

      <div class="divider" />

      <button class="tool-btn" @click="onNewMap">
        <component :is="FilePlus" :size="18" />
        <span class="tooltip">新建导图</span>
      </button>
    </div>

    <input
      ref="fileInput"
      type="file"
      style="display: none"
      accept=".json,.mm,.opml,.xml"
      @change="onFileSelected"
    />
  </div>
</template>

<script setup>import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Undo2, Redo2, ChevronRight, Plus, Trash2, Play, Upload, Download, FilePlus } from 'lucide-vue-next';
import { useMindmapStore } from '@/stores/mindmap.js';
import { useHistoryStore } from '@/stores/history.js';
import { usePresentationStore } from '@/stores/presentation.js';
import { exportJSON, exportMarkdown, exportOPML, exportFreeMind, exportSVG, exportPNG, importFromFile } from '@/utils/io.js';
const mindmapStore = useMindmapStore();
const historyStore = useHistoryStore();
const presentationStore = usePresentationStore();
const fileInput = ref(null);
const exportMenu = ref(null);
const showExportMenu = ref(false);
const title = computed({
 get: () => mindmapStore.mindmap?.title || '',
 set: (val) => val
});
const currentLayout = computed({
 get: () => mindmapStore.mindmap?.layout || 'horizontal',
 set: (val) => val
});
const currentTheme = computed({
 get: () => mindmapStore.mindmap?.theme || 'classic',
 set: (val) => val
});
const hasSelection = computed(() => !!mindmapStore.selectedNodeId);
const isRootSelected = computed(() => mindmapStore.selectedNodeId === mindmapStore.mindmap?.rootNodeId);
const isBold = computed(() => mindmapStore.selectedNode?.bold || false);
const isItalic = computed(() => mindmapStore.selectedNode?.italic || false);
const isUnderline = computed(() => mindmapStore.selectedNode?.underline || false);
const canUndo = computed(() => historyStore.canUndo());
const canRedo = computed(() => historyStore.canRedo());
const onTitleChange = (e) => {
 historyStore.saveState();
 mindmapStore.setTitle(e.target.value);
};
const onUndo = () => {
 historyStore.undo();
};
const onRedo = () => {
 historyStore.redo();
};
const onAddChild = () => {
 if (!mindmapStore.selectedNodeId)
 return;
 historyStore.saveState();
 mindmapStore.addChildNode(mindmapStore.selectedNodeId);
};
const onAddSibling = () => {
 if (!mindmapStore.selectedNodeId)
 return;
 historyStore.saveState();
 mindmapStore.addSiblingNode(mindmapStore.selectedNodeId);
};
const onDelete = () => {
 if (!mindmapStore.selectedNodeId)
 return;
 historyStore.saveState();
 mindmapStore.deleteNode(mindmapStore.selectedNodeId);
};
const onToggleBold = () => {
 if (!mindmapStore.selectedNodeId)
 return;
 historyStore.saveState();
 mindmapStore.updateNode(mindmapStore.selectedNodeId, { bold: !isBold.value });
};
const onToggleItalic = () => {
 if (!mindmapStore.selectedNodeId)
 return;
 historyStore.saveState();
 mindmapStore.updateNode(mindmapStore.selectedNodeId, { italic: !isItalic.value });
};
const onToggleUnderline = () => {
 if (!mindmapStore.selectedNodeId)
 return;
 historyStore.saveState();
 mindmapStore.updateNode(mindmapStore.selectedNodeId, { underline: !isUnderline.value });
};
const onLayoutChange = (e) => {
 historyStore.saveState();
 mindmapStore.setLayout(e.target.value);
};
const onThemeChange = (e) => {
 mindmapStore.applyTheme(e.target.value);
};
const onStartPresentation = () => {
 presentationStore.start();
};
const onImport = () => {
 fileInput.value?.click();
};
const onFileSelected = async (e) => {
 const file = e.target.files[0];
 if (!file)
 return;
 try {
 const data = await importFromFile(file);
 historyStore.saveState();
 mindmapStore.importMindmap(data);
 }
 catch (err) {
 alert('导入失败: ' + err.message);
 }
 e.target.value = '';
};
const toggleExportMenu = () => {
 showExportMenu.value = !showExportMenu.value;
};
const onExportJSON = () => {
 showExportMenu.value = false;
 exportJSON(mindmapStore.mindmap);
};
const onExportMarkdown = () => {
 showExportMenu.value = false;
 exportMarkdown(mindmapStore.mindmap);
};
const onExportOPML = () => {
 showExportMenu.value = false;
 exportOPML(mindmapStore.mindmap);
};
const onExportFreeMind = () => {
 showExportMenu.value = false;
 exportFreeMind(mindmapStore.mindmap);
};
const onExportSVG = () => {
 showExportMenu.value = false;
 const svg = document.querySelector('.canvas-svg');
 if (svg)
 exportSVG(svg, `${mindmapStore.mindmap.title}.svg`);
};
const onExportPNG = () => {
 showExportMenu.value = false;
 const svg = document.querySelector('.canvas-svg');
 if (svg)
 exportPNG(svg, `${mindmapStore.mindmap.title}.png`);
};
const onNewMap = () => {
 if (confirm('确定要创建新的思维导图吗？当前内容将被清除。')) {
 historyStore.clear();
 mindmapStore.createNew();
 }
};
const handleClickOutside = (e) => {
 if (exportMenu.value && !exportMenu.value.contains(e.target)) {
 showExportMenu.value = false;
 }
};
onMounted(() => {
 document.addEventListener('click', handleClickOutside);
});
onUnmounted(() => {
 document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  gap: 16px;
  min-height: 52px;
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-input {
  font-size: 16px;
  font-weight: 600;
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  outline: none;
  min-width: 200px;
}

.title-input:focus {
  border-color: var(--accent);
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tool-btn {
  position: relative;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.tool-btn:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.tool-btn.active {
  background: var(--accent);
  color: white;
}

.tool-btn.danger:hover:not(:disabled) {
  background: #fee2e2;
  color: #dc2626;
}

.tool-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tooltip {
  position: absolute;
  bottom: -32px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--text-primary);
  color: var(--bg-primary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 1000;
}

.tool-btn:hover .tooltip {
  opacity: 1;
}

.divider {
  width: 1px;
  height: 24px;
  background: var(--border);
  margin: 0 8px;
}

.layout-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-right: 4px;
}

.layout-select {
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  outline: none;
}

.layout-select:focus {
  border-color: var(--accent);
}

.export-menu {
  position: relative;
}

.export-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 4px 12px var(--shadow);
  z-index: 100;
  min-width: 120px;
}

.export-dropdown button {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  text-align: left;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s ease;
}

.export-dropdown button:hover {
  background: var(--bg-tertiary);
}
</style>
