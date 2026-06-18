<template>
  <Transition name="fade">
    <div v-if="isActive" class="presentation-overlay">
      <div class="presentation-backdrop" />

      <div class="progress-bar-wrapper">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: progressPercent + '%' }"
          />
        </div>
      </div>

      <Transition name="slide" mode="out-in">
        <div class="node-display" :key="currentIndex">
          <div class="node-icon-large" v-if="currentNodeIcon">
            <component :is="currentNodeIcon" :size="48" :stroke-width="1.5" />
          </div>
          <h2 class="node-title">{{ currentNode?.text || '无节点' }}</h2>
          <div class="node-meta" v-if="currentNodeChildren > 0">
            <component :is="GitBranch" :size="14" />
            <span>{{ currentNodeChildren }} 个子节点</span>
          </div>
        </div>
      </Transition>

      <div class="presentation-controls">
        <div class="slide-info">
          <span class="current">{{ currentIndex + 1 }}</span>
          <span class="divider">/</span>
          <span class="total">{{ totalNodes }}</span>
        </div>

        <div class="control-buttons">
          <button class="control-btn" @click="onPrev" :disabled="currentIndex === 0">
            <component :is="SkipBack" :size="20" />
          </button>
          
          <button class="control-btn play-btn" @click="onTogglePause">
            <Transition name="icon-fade" mode="out-in">
              <component :key="isPaused ? 'play' : 'pause'" :is="isPaused ? Play : Pause" :size="28" />
            </Transition>
          </button>
          
          <button class="control-btn" @click="onNext" :disabled="currentIndex >= totalNodes - 1">
            <component :is="SkipForward" :size="20" />
          </button>
          
          <div class="divider-vertical" />
          
          <button class="control-btn close-btn" @click="onStop">
            <component :is="X" :size="20" />
          </button>
        </div>

        <div class="speed-control">
          <button
            v-for="s in speeds"
            :key="s.value"
            class="speed-btn"
            :class="{ active: autoPlayInterval === s.value }"
            @click="setSpeed(s.value)"
          >
            {{ s.label }}
          </button>
        </div>
      </div>

      <div class="hint-bar">
        <span class="hint-item">
          <kbd>空格</kbd> 播放/暂停
        </span>
        <span class="hint-item">
          <kbd>←</kbd> 上一步
        </span>
        <span class="hint-item">
          <kbd>→</kbd> 下一步
        </span>
        <span class="hint-item">
          <kbd>Esc</kbd> 退出
        </span>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Play, Pause, SkipBack, SkipForward, X, GitBranch } from 'lucide-vue-next'
import * as LucideIcons from 'lucide-vue-next'
import { usePresentationStore } from '@/stores/presentation.js'
import { useMindmapStore } from '@/stores/mindmap.js'

const presentationStore = usePresentationStore()
const mindmapStore = useMindmapStore()

const isActive = computed(() => presentationStore.isActive)
const currentIndex = computed(() => presentationStore.currentIndex)
const totalNodes = computed(() => presentationStore.totalNodes)
const currentNode = computed(() => presentationStore.currentNode)
const isPaused = computed(() => presentationStore.isPaused)
const autoPlayInterval = computed(() => presentationStore.autoPlayInterval)

const speeds = [
  { label: '0.5x', value: 6000 },
  { label: '1x', value: 3000 },
  { label: '2x', value: 1500 },
  { label: '4x', value: 750 }
]

const containerWidth = ref(1200)
const containerHeight = ref(800)

const progressPercent = computed(() => {
  if (totalNodes.value <= 1) return 100
  return ((currentIndex.value + 1) / totalNodes.value) * 100
})

const currentNodeIcon = computed(() => {
  if (!currentNode.value?.icon) return null
  return LucideIcons[currentNode.value.icon] || null
})

const currentNodeChildren = computed(() => {
  if (!currentNode.value) return 0
  return Object.values(mindmapStore.nodes).filter(n => n.parentId === currentNode.value.id).length
})

const getContainerSize = () => {
  containerWidth.value = window.innerWidth
  containerHeight.value = window.innerHeight
}

const onPrev = () => {
  getContainerSize()
  presentationStore.prev(containerWidth.value, containerHeight.value)
}

const onNext = () => {
  getContainerSize()
  presentationStore.next(containerWidth.value, containerHeight.value)
}

const onTogglePause = () => {
  presentationStore.togglePause()
}

const onStop = () => {
  presentationStore.stop()
}

const setSpeed = (speed) => {
  presentationStore.autoPlayInterval = speed
  if (!isPaused.value) {
    presentationStore.pause()
    nextTick(() => presentationStore.resume())
  }
}

const onKeyDown = (e) => {
  if (!isActive.value) return
  getContainerSize()
  switch (e.key) {
    case ' ':
      e.preventDefault()
      onTogglePause()
      break
    case 'ArrowLeft':
      e.preventDefault()
      onPrev()
      break
    case 'ArrowRight':
      e.preventDefault()
      onNext()
      break
    case 'Escape':
      e.preventDefault()
      onStop()
      break
  }
}

watch(() => presentationStore.isActive, (val) => {
  if (val) {
    getContainerSize()
    presentationStore.start(containerWidth.value, containerHeight.value)
  }
})

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('resize', getContainerSize)
  getContainerSize()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('resize', getContainerSize)
})
</script>

<style scoped>
.presentation-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.presentation-backdrop {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.7) 100%);
  pointer-events: none;
}

.progress-bar-wrapper {
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  max-width: 600px;
  pointer-events: none;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 2px;
  transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 0 12px var(--accent);
}

.node-display {
  text-align: center;
  color: white;
  z-index: 1;
  pointer-events: none;
  max-width: 80%;
}

.node-icon-large {
  margin-bottom: 24px;
  opacity: 0.9;
  animation: icon-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.node-icon-large :deep(svg) {
  filter: drop-shadow(0 4px 20px var(--accent));
  color: var(--accent);
}

@keyframes icon-bounce {
  0% {
    opacity: 0;
    transform: scale(0.3) rotate(-20deg);
  }
  60% {
    transform: scale(1.2) rotate(5deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

.node-title {
  margin: 0;
  font-size: 48px;
  font-weight: 700;
  line-height: 1.2;
  text-shadow: 0 4px 32px rgba(0, 0, 0, 0.5);
  animation: title-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  word-break: break-word;
}

@keyframes title-in {
  0% {
    opacity: 0;
    transform: translateY(40px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.node-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  animation: meta-in 0.6s ease-out 0.2s both;
}

@keyframes meta-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.presentation-controls {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 24px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
  pointer-events: auto;
  animation: controls-in 0.4s ease-out;
}

@keyframes controls-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.slide-info {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-family: monospace;
}

.slide-info .current {
  font-size: 24px;
  font-weight: 700;
  color: var(--accent);
}

.slide-info .divider {
  color: rgba(255, 255, 255, 0.3);
  font-size: 16px;
}

.slide-info .total {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  width: 44px;
  height: 44px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.control-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.16);
  transform: scale(1.05);
}

.control-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.play-btn {
  width: 56px;
  height: 56px;
  background: var(--accent);
}

.play-btn:hover {
  background: var(--accent-hover) !important;
  box-shadow: 0 0 24px var(--accent);
}

.divider-vertical {
  width: 1px;
  height: 28px;
  background: rgba(255, 255, 255, 0.15);
  margin: 0 4px;
}

.close-btn:hover {
  background: #dc2626 !important;
}

.speed-control {
  display: flex;
  gap: 4px;
  background: rgba(255, 255, 255, 0.06);
  padding: 4px;
  border-radius: 10px;
}

.speed-btn {
  padding: 6px 10px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.speed-btn:hover {
  color: white;
}

.speed-btn.active {
  background: var(--accent);
  color: white;
}

.hint-bar {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 16px;
  pointer-events: none;
  animation: hints-in 0.5s ease-out 0.3s both;
}

@keyframes hints-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

kbd {
  padding: 3px 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active {
  animation: slide-enter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-leave-active {
  animation: slide-leave 0.3s ease-in;
}

@keyframes slide-enter {
  from {
    opacity: 0;
    transform: translateX(60px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slide-leave {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-60px);
  }
}

.icon-fade-enter-active,
.icon-fade-leave-active {
  transition: all 0.15s ease;
}

.icon-fade-enter-from,
.icon-fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
