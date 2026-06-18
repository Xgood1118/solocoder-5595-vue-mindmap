<template>
  <div class="app-container">
    <Toolbar />
    
    <div class="main-content">
      <OutlinePanel v-if="!isOutlineLayout" />
      
      <div class="canvas-area">
        <MindmapCanvas
          v-if="!isOutlineLayout"
          ref="canvasRef"
        />
        <OutlineView v-else />
      </div>
      
      <PropertyPanel v-if="!isOutlineLayout" />
    </div>

    <PresentationOverlay />
    
    <KeyboardShortcuts />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Toolbar from './components/Toolbar.vue'
import OutlinePanel from './components/OutlinePanel.vue'
import PropertyPanel from './components/PropertyPanel.vue'
import MindmapCanvas from './components/MindmapCanvas.vue'
import OutlineView from './components/OutlineView.vue'
import PresentationOverlay from './components/PresentationOverlay.vue'
import KeyboardShortcuts from './components/KeyboardShortcuts.vue'
import { useMindmapStore } from './stores/mindmap.js'
import { LayoutType } from './data/types.js'

const mindmapStore = useMindmapStore()
const canvasRef = ref(null)

const isOutlineLayout = computed(() => mindmapStore.mindmap?.layout === LayoutType.OUTLINE)

onMounted(() => {
  mindmapStore.init()
})
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.canvas-area {
  flex: 1;
  overflow: hidden;
  position: relative;
}
</style>
