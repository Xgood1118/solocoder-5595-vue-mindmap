import { defineStore } from 'pinia'
import { ref } from 'vue'
import { deepClone } from '@/utils/helpers.js'
import { useMindmapStore } from './mindmap.js'

const MAX_HISTORY = 50

export const useHistoryStore = defineStore('history', () => {
  const past = ref([])
  const future = ref([])

  const saveState = () => {
    const mindmapStore = useMindmapStore()
    if (past.value.length >= MAX_HISTORY) {
      past.value.shift()
    }
    past.value.push(deepClone(mindmapStore.mindmap))
    future.value = []
  }

  const undo = () => {
    if (past.value.length === 0) return
    const mindmapStore = useMindmapStore()
    future.value.push(deepClone(mindmapStore.mindmap))
    const previousState = past.value.pop()
    mindmapStore.importMindmap(previousState)
  }

  const redo = () => {
    if (future.value.length === 0) return
    const mindmapStore = useMindmapStore()
    past.value.push(deepClone(mindmapStore.mindmap))
    const nextState = future.value.pop()
    mindmapStore.importMindmap(nextState)
  }

  const canUndo = () => past.value.length > 0
  const canRedo = () => future.value.length > 0

  const clear = () => {
    past.value = []
    future.value = []
  }

  return {
    past,
    future,
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    clear
  }
})
