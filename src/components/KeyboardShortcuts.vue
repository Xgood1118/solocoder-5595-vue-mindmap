<template>
  <div style="display: none" />
</template>

<script setup>
import { onMounted, onUnmounted, computed } from 'vue'
import { useMindmapStore } from '@/stores/mindmap.js'
import { useHistoryStore } from '@/stores/history.js'
import { usePresentationStore } from '@/stores/presentation.js'

const mindmapStore = useMindmapStore()
const historyStore = useHistoryStore()
const presentationStore = usePresentationStore()

const selectedNodeId = computed(() => mindmapStore.selectedNodeId)
const editingNodeId = computed(() => mindmapStore.editingNodeId)
const isPresentationActive = computed(() => presentationStore.isActive)

const onKeyDown = (e) => {
  if (editingNodeId.value) return

  const ctrlPressed = e.ctrlKey || e.metaKey

  if (isPresentationActive.value) {
    if (e.key === ' ') {
      e.preventDefault()
      presentationStore.togglePause()
      return
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      presentationStore.prev()
      return
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      presentationStore.next()
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      presentationStore.stop()
      return
    }
    return
  }

  if (ctrlPressed && e.key.toLowerCase() === 'z' && !e.shiftKey) {
    e.preventDefault()
    historyStore.undo()
    return
  }

  if (ctrlPressed && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
    e.preventDefault()
    historyStore.redo()
    return
  }

  if (!selectedNodeId.value) return

  if (e.key === 'Tab') {
    e.preventDefault()
    historyStore.saveState()
    mindmapStore.addChildNode(selectedNodeId.value)
    return
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    historyStore.saveState()
    mindmapStore.addSiblingNode(selectedNodeId.value)
    return
  }

  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (selectedNodeId.value !== mindmapStore.mindmap?.rootNodeId) {
      e.preventDefault()
      historyStore.saveState()
      mindmapStore.deleteNode(selectedNodeId.value)
    }
    return
  }

  if (e.key === 'F2') {
    e.preventDefault()
    mindmapStore.startEditing(selectedNodeId.value)
    return
  }

  if (ctrlPressed && e.key.toLowerCase() === 'b') {
    e.preventDefault()
    historyStore.saveState()
    const node = mindmapStore.selectedNode
    if (node) {
      mindmapStore.updateNode(selectedNodeId.value, { bold: !node.bold })
    }
    return
  }

  if (ctrlPressed && e.key.toLowerCase() === 'i') {
    e.preventDefault()
    historyStore.saveState()
    const node = mindmapStore.selectedNode
    if (node) {
      mindmapStore.updateNode(selectedNodeId.value, { italic: !node.italic })
    }
    return
  }

  if (ctrlPressed && e.key.toLowerCase() === 'u') {
    e.preventDefault()
    historyStore.saveState()
    const node = mindmapStore.selectedNode
    if (node) {
      mindmapStore.updateNode(selectedNodeId.value, { underline: !node.underline })
    }
    return
  }

  if (ctrlPressed && e.key.toLowerCase() === 's') {
    e.preventDefault()
    mindmapStore.save()
    return
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>
