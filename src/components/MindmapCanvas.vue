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
            v-for="conn in visibleConnections"
            :key="`conn-${conn.from}-${conn.to}`"
            :from="nodes[conn.from]"
            :to="nodes[conn.to]"
            :curve="connectionStyle.curve"
            :width="connectionStyle.width"
            :color="connectionStyle.color || 'var(--connection)'"
          />
        </g>
        
        <g class="nodes-layer">
          <MindmapNode
            v-for="node in visibleNodes"
            :key="node.id"
            ref="nodeRefs"
            :node="node"
            :pos="getNodePosition(node.id)"
            :is-selected="node.id === selectedNodeId"
            :is-editing="node.id === editingNodeId"
            :is-presentation="isPresentationMode && presentationNodeId === node.id"
            :has-children="nodeHasChildren(node.id)"
            @select="onSelectNode"
            @edit-start="onEditStart"
            @edit-end="onEditEnd"
            @toggle-expand="onToggleExpand"
            @drag-start="onNodeDragStart"
          />
        </g>

        <g v-if="dragIndicator.visible" class="drag-indicator">
          <line
            v-if="dragIndicator.type === 'before' || dragIndicator.type === 'after'"
            :x1="dragIndicator.x"
            :y1="dragIndicator.y"
            :x2="dragIndicator.x + 100"
            :y2="dragIndicator.y"
            stroke="var(--selected)"
            stroke-width="3"
            stroke-dasharray="5,5"
          />
          <rect
            v-else
            :x="dragIndicator.x"
            :y="dragIndicator.y"
            :width="dragIndicator.width"
            :height="dragIndicator.height"
            fill="none"
            stroke="var(--selected)"
            stroke-width="3"
            stroke-dasharray="5,5"
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
  </div>
</template>

<script setup>import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-vue-next';
import MindmapNode from './MindmapNode.vue';
import MindmapConnection from './MindmapConnection.vue';
import { useMindmapStore } from '@/stores/mindmap.js';
import { usePresentationStore } from '@/stores/presentation.js';
import { getNodeSize } from '@/utils/helpers.js';
import { LayoutType } from '@/data/types.js';
const mindmapStore = useMindmapStore();
const presentationStore = usePresentationStore();
const canvasContainer = ref(null);
const canvasWrapper = ref(null);
const svgRef = ref(null);
const nodeRefs = ref({});
const viewportX = ref(0);
const viewportY = ref(0);
const scale = ref(1);
const isPanning = ref(false);
const panStart = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragData = ref(null);
const dragIndicator = ref({
 visible: false,
 type: null,
 x: 0,
 y: 0,
 width: 0,
 height: 0,
 targetId: null
});
const canvasWidth = ref(5000);
const canvasHeight = ref(4000);
const nodes = computed(() => mindmapStore.nodes);
const selectedNodeId = computed(() => mindmapStore.selectedNodeId);
const editingNodeId = computed(() => mindmapStore.editingNodeId);
const connectionStyle = computed(() => mindmapStore.mindmap?.connectionStyle || {});
const layout = computed(() => mindmapStore.mindmap?.layout);
const isPresentationMode = computed(() => presentationStore.isActive);
const presentationNodeId = computed(() => presentationStore.currentNode?.id);
const visibleNodes = computed(() => {
 const allNodes = Object.values(nodes.value);
 if (!allNodes.length)
 return allNodes;
 return allNodes.filter(node => {
 if (node.parentId) {
 const parent = nodes.value[node.parentId];
 if (parent && parent.expanded === false)
 return false;
 }
 return true;
 });
});
const visibleConnections = computed(() => {
 const conns = [];
 visibleNodes.value.forEach(node => {
 if (node.parentId && nodes.value[node.parentId]) {
 const parentVisible = visibleNodes.value.find(n => n.id === node.parentId);
 if (parentVisible) {
 conns.push({ from: node.parentId, to: node.id });
 }
 }
 });
 return conns;
});
const wrapperStyle = computed(() => ({
 transform: `translate(${viewportX.value}px, ${viewportY.value}px) scale(${scale.value})`,
 transformOrigin: '0 0'
}));
const getNodePosition = (nodeId) => {
 const node = nodes.value[nodeId];
 if (!node)
 return { x: 0, y: 0 };
 return { x: node.x, y: node.y };
};
const nodeHasChildren = (nodeId) => {
 return Object.values(nodes.value).some(n => n.parentId === nodeId);
};
const onSelectNode = (nodeId) => {
 mindmapStore.selectNode(nodeId);
};
const onEditStart = (nodeId) => {
 mindmapStore.startEditing(nodeId);
};
const onEditEnd = ({ nodeId, text, action }) => {
 if (text !== null) {
 mindmapStore.updateNode(nodeId, { text });
 }
 mindmapStore.stopEditing();
};
const onToggleExpand = (nodeId) => {
 mindmapStore.toggleNodeExpand(nodeId);
};
const onCanvasMouseDown = (e) => {
 if (e.target.closest('.mindmap-node'))
 return;
 if (e.target.closest('.canvas-controls'))
 return;
 if (e.button === 0 || e.button === 1) {
 isPanning.value = true;
 panStart.value = { x: e.clientX - viewportX.value, y: e.clientY - viewportY.value };
 document.body.style.cursor = 'grabbing';
 }
 mindmapStore.selectNode(null);
};
const onMouseMove = (e) => {
 if (isPanning.value) {
 viewportX.value = e.clientX - panStart.value.x;
 viewportY.value = e.clientY - panStart.value.y;
 }
 if (isDragging.value && dragData.value) {
 updateDragIndicator(e);
 }
};
const onMouseUp = (e) => {
 if (isPanning.value) {
 isPanning.value = false;
 document.body.style.cursor = '';
 mindmapStore.setViewport(viewportX.value, viewportY.value, scale.value);
 }
 if (isDragging.value) {
 finishDrag(e);
 }
};
const onWheel = (e) => {
 e.preventDefault();
 const delta = e.deltaY > 0 ? 0.9 : 1.1;
 const newScale = Math.max(0.2, Math.min(3, scale.value * delta));
 const rect = canvasContainer.value.getBoundingClientRect();
 const mouseX = e.clientX - rect.left;
 const mouseY = e.clientY - rect.top;
 viewportX.value = mouseX - (mouseX - viewportX.value) * (newScale / scale.value);
 viewportY.value = mouseY - (mouseY - viewportY.value) * (newScale / scale.value);
 scale.value = newScale;
 mindmapStore.setViewport(viewportX.value, viewportY.value, scale.value);
};
const zoomIn = () => {
 scale.value = Math.min(3, scale.value * 1.2);
 mindmapStore.setViewport(viewportX.value, viewportY.value, scale.value);
};
const zoomOut = () => {
 scale.value = Math.max(0.2, scale.value / 1.2);
 mindmapStore.setViewport(viewportX.value, viewportY.value, scale.value);
};
const resetView = () => {
 viewportX.value = 0;
 viewportY.value = 0;
 scale.value = 1;
 mindmapStore.setViewport(0, 0, 1);
};
const onNodeDragStart = ({ nodeId, event }) => {
 if (layout.value === LayoutType.OUTLINE)
 return;
 isDragging.value = true;
 dragData.value = {
 nodeId,
 startX: event.clientX,
 startY: event.clientY,
 originalX: nodes.value[nodeId]?.x || 0,
 originalY: nodes.value[nodeId]?.y || 0
 };
 document.body.style.cursor = 'grabbing';
};
const updateDragIndicator = (e) => {
 if (!dragData.value)
 return;
 const mouseX = (e.clientX - canvasContainer.value.getBoundingClientRect().left - viewportX.value) / scale.value;
 const mouseY = (e.clientY - canvasContainer.value.getBoundingClientRect().top - viewportY.value) / scale.value;
 if (layout.value === LayoutType.FREE) {
 dragIndicator.value = {
 visible: false
 };
 return;
 }
 let bestTarget = null;
 let bestDistance = Infinity;
 let bestType = 'child';
 visibleNodes.value.forEach(node => {
 if (node.id === dragData.value.nodeId)
 return;
 const nodeSize = getNodeSize(node.text);
 const nodeCenter = {
 x: node.x + nodeSize.width / 2,
 y: node.y + nodeSize.height / 2
 };
 const dist = Math.hypot(mouseX - nodeCenter.x, mouseY - nodeCenter.y);
 if (dist < bestDistance && dist < 150) {
 bestDistance = dist;
 bestTarget = node;
 if (mouseY < node.y + 10) {
 bestType = 'before';
 }
 else if (mouseY > node.y + nodeSize.height - 10) {
 bestType = 'after';
 }
 else {
 bestType = 'child';
 }
 }
 });
 if (bestTarget) {
 const nodeSize = getNodeSize(bestTarget.text);
 if (bestType === 'before') {
 dragIndicator.value = {
 visible: true,
 type: 'before',
 x: bestTarget.x,
 y: bestTarget.y - 5,
 width: nodeSize.width,
 height: 3,
 targetId: bestTarget.id
 };
 }
 else if (bestType === 'after') {
 dragIndicator.value = {
 visible: true,
 type: 'after',
 x: bestTarget.x,
 y: bestTarget.y + nodeSize.height + 2,
 width: nodeSize.width,
 height: 3,
 targetId: bestTarget.id
 };
 }
 else {
 dragIndicator.value = {
 visible: true,
 type: 'child',
 x: bestTarget.x - 3,
 y: bestTarget.y - 3,
 width: nodeSize.width + 6,
 height: nodeSize.height + 6,
 targetId: bestTarget.id
 };
 }
 }
 else {
 dragIndicator.value = { visible: false };
 }
};
const finishDrag = (e) => {
 if (!dragData.value)
 return;
 if (layout.value === LayoutType.FREE) {
 const dx = (e.clientX - dragData.value.startX) / scale.value;
 const dy = (e.clientY - dragData.value.startY) / scale.value;
 mindmapStore.moveNodePosition(dragData.value.nodeId, dragData.value.originalX + dx, dragData.value.originalY + dy);
 }
 else if (dragIndicator.value.targetId) {
 const { targetId, type } = dragIndicator.value;
 if (type === 'child') {
 mindmapStore.moveNode(dragData.value.nodeId, targetId);
 }
 else {
 const targetNode = nodes.value[targetId];
 if (targetNode) {
 mindmapStore.moveNode(dragData.value.nodeId, targetNode.parentId);
 }
 }
 }
 isDragging.value = false;
 dragData.value = null;
 dragIndicator.value.visible = false;
 document.body.style.cursor = '';
};
const onDrop = (e) => {
 e.preventDefault();
};
watch(() => mindmapStore.mindmap?.viewport, (vp) => {
 if (vp) {
 viewportX.value = vp.x;
 viewportY.value = vp.y;
 scale.value = vp.scale;
 }
}, { immediate: true });
onMounted(() => {
 window.addEventListener('mousemove', onMouseMove);
 window.addEventListener('mouseup', onMouseUp);
});
onUnmounted(() => {
 window.removeEventListener('mousemove', onMouseMove);
 window.removeEventListener('mouseup', onMouseUp);
});
defineExpose({
 svgRef,
 getSvgElement: () => svgRef.value
});
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
  transition: transform 0.05s ease-out;
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
</style>
