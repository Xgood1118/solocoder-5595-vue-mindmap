import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useMindmapStore } from './mindmap.js'

export const usePresentationStore = defineStore('presentation', () => {
  const isActive = ref(false)
  const currentIndex = ref(0)
  const isPaused = ref(false)
  const autoPlayTimer = ref(null)
  const autoPlayInterval = ref(3000)

  const currentNode = computed(() => {
    const mindmapStore = useMindmapStore()
    const nodes = mindmapStore.getNodesInOrder
    return nodes[currentIndex.value] || null
  })

  const totalNodes = computed(() => {
    const mindmapStore = useMindmapStore()
    return mindmapStore.getNodesInOrder.length
  })

  const start = (containerWidth, containerHeight) => {
    isActive.value = true
    currentIndex.value = 0
    isPaused.value = false
    focusCurrentNode(containerWidth, containerHeight)
    startAutoPlay()
  }

  const stop = () => {
    isActive.value = false
    stopAutoPlay()
  }

  const next = (containerWidth, containerHeight) => {
    const mindmapStore = useMindmapStore()
    if (currentIndex.value < totalNodes.value - 1) {
      currentIndex.value++
      focusCurrentNode(containerWidth, containerHeight)
    }
  }

  const prev = (containerWidth, containerHeight) => {
    if (currentIndex.value > 0) {
      currentIndex.value--
      focusCurrentNode(containerWidth, containerHeight)
    }
  }

  const pause = () => {
    isPaused.value = true
    stopAutoPlay()
  }

  const resume = () => {
    isPaused.value = false
    startAutoPlay()
  }

  const togglePause = () => {
    if (isPaused.value) {
      resume()
    } else {
      pause()
    }
  }

  const goTo = (index, containerWidth, containerHeight) => {
    if (index >= 0 && index < totalNodes.value) {
      currentIndex.value = index
      focusCurrentNode(containerWidth, containerHeight)
    }
  }

  const focusCurrentNode = (containerWidth, containerHeight) => {
    const mindmapStore = useMindmapStore()
    if (currentNode.value) {
      mindmapStore.selectNode(currentNode.value.id)
      if (containerWidth && containerHeight) {
        mindmapStore.centerNodeInViewport(currentNode.value.id, containerWidth, containerHeight)
      }
    }
  }

  const startAutoPlay = () => {
    stopAutoPlay()
    autoPlayTimer.value = setInterval(() => {
      if (currentIndex.value < totalNodes.value - 1) {
        next()
      } else {
        pause()
      }
    }, autoPlayInterval.value)
  }

  const stopAutoPlay = () => {
    if (autoPlayTimer.value) {
      clearInterval(autoPlayTimer.value)
      autoPlayTimer.value = null
    }
  }

  return {
    isActive,
    currentIndex,
    isPaused,
    currentNode,
    totalNodes,
    autoPlayInterval,
    start,
    stop,
    next,
    prev,
    pause,
    resume,
    togglePause,
    goTo
  }
})
