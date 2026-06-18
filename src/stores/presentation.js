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

  const start = () => {
    isActive.value = true
    currentIndex.value = 0
    isPaused.value = false
    focusCurrentNode()
    startAutoPlay()
  }

  const stop = () => {
    isActive.value = false
    stopAutoPlay()
  }

  const next = () => {
    const mindmapStore = useMindmapStore()
    if (currentIndex.value < totalNodes.value - 1) {
      currentIndex.value++
      focusCurrentNode()
    }
  }

  const prev = () => {
    if (currentIndex.value > 0) {
      currentIndex.value--
      focusCurrentNode()
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

  const goTo = (index) => {
    if (index >= 0 && index < totalNodes.value) {
      currentIndex.value = index
      focusCurrentNode()
    }
  }

  const focusCurrentNode = () => {
    const mindmapStore = useMindmapStore()
    if (currentNode.value) {
      mindmapStore.selectNode(currentNode.value.id)
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
