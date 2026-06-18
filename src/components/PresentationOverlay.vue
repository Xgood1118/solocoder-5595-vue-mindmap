<template>
  <Transition name="fade">
    <div v-if="isActive" class="presentation-overlay">
      <div class="presentation-content">
        <div class="slide-info">
          <span class="current">{{ currentIndex + 1 }}</span>
          <span class="divider">/</span>
          <span class="total">{{ totalNodes }}</span>
        </div>

        <div class="current-node">
          <h2 class="node-title">{{ currentNode?.text || '无节点' }}</h2>
        </div>

        <div class="controls">
          <button class="control-btn" @click="onPrev" :disabled="currentIndex === 0">
            <component :is="SkipBack" :size="20" />
          </button>
          
          <button class="control-btn play-btn" @click="onTogglePause">
            <component :is="isPaused ? Play : Pause" :size="24" />
          </button>
          
          <button class="control-btn" @click="onNext" :disabled="currentIndex >= totalNodes - 1">
            <component :is="SkipForward" :size="20" />
          </button>
          
          <div class="divider-vertical" />
          
          <button class="control-btn close-btn" @click="onStop">
            <component :is="X" :size="20" />
          </button>
        </div>

        <div class="hint">
          按 <kbd>空格</kbd> 播放/暂停
          <kbd>←</kbd> 上一步
          <kbd>→</kbd> 下一步
          <kbd>Esc</kbd> 退出
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>import { computed, onMounted, onUnmounted } from 'vue';
import { Play, Pause, SkipBack, SkipForward, X } from 'lucide-vue-next';
import { usePresentationStore } from '@/stores/presentation.js';
const presentationStore = usePresentationStore();
const isActive = computed(() => presentationStore.isActive);
const currentIndex = computed(() => presentationStore.currentIndex);
const totalNodes = computed(() => presentationStore.totalNodes);
const currentNode = computed(() => presentationStore.currentNode);
const isPaused = computed(() => presentationStore.isPaused);
const onPrev = () => presentationStore.prev();
const onNext = () => presentationStore.next();
const onTogglePause = () => presentationStore.togglePause();
const onStop = () => presentationStore.stop();
const onKeyDown = (e) => {
 if (!isActive.value)
 return;
 switch (e.key) {
 case ' ':
 e.preventDefault();
 onTogglePause();
 break;
 case 'ArrowLeft':
 e.preventDefault();
 onPrev();
 break;
 case 'ArrowRight':
 e.preventDefault();
 onNext();
 break;
 case 'Escape':
 e.preventDefault();
 onStop();
 break;
 }
};
onMounted(() => {
 window.addEventListener('keydown', onKeyDown);
});
onUnmounted(() => {
 window.removeEventListener('keydown', onKeyDown);
});
</script>

<style scoped>
.presentation-overlay {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.presentation-content {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px 24px;
  box-shadow: 0 8px 32px var(--shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  min-width: 400px;
}

.slide-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-secondary);
}

.slide-info .current {
  font-weight: 600;
  color: var(--accent);
  font-size: 16px;
}

.slide-info .total {
  color: var(--text-muted);
}

.current-node {
  text-align: center;
}

.node-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  max-width: 600px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.control-btn:hover:not(:disabled) {
  background: var(--accent);
  color: white;
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.play-btn {
  width: 48px;
  height: 48px;
  background: var(--accent);
  color: white;
}

.play-btn:hover {
  background: var(--accent-hover);
}

.divider-vertical {
  width: 1px;
  height: 24px;
  background: var(--border);
  margin: 0 4px;
}

.close-btn:hover {
  background: #dc2626;
}

.hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-muted);
}

kbd {
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-family: monospace;
  font-size: 10px;
  border: 1px solid var(--border);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
