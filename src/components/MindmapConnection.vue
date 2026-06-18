<template>
  <g class="mindmap-connection">
    <path
      :d="pathD"
      fill="none"
      :stroke="color"
      :stroke-width="width"
      stroke-linecap="round"
      class="connection-path"
    />
  </g>
</template>

<script setup>
import { computed } from 'vue'
import { ConnectionCurve } from '@/data/types.js'
import { getNodeSize, getNodeCenter } from '@/utils/helpers.js'

const props = defineProps({
  from: {
    type: Object,
    required: true
  },
  to: {
    type: Object,
    required: true
  },
  curve: {
    type: String,
    default: ConnectionCurve.BEZIER
  },
  width: {
    type: Number,
    default: 2
  },
  color: {
    type: String,
    default: 'var(--connection)'
  }
})

const pathD = computed(() => {
  const fromSize = getNodeSize(props.from.text)
  const toSize = getNodeSize(props.to.text)
  
  const fromCenter = getNodeCenter(props.from)
  const toCenter = getNodeCenter(props.to)
  
  const fromX = props.from.x + fromSize.width
  const fromY = fromCenter.y
  const toX = props.to.x
  const toY = toCenter.y

  switch (props.curve) {
    case ConnectionCurve.STRAIGHT:
      return `M${fromX},${fromY} L${toX},${toY}`
    
    case ConnectionCurve.BEZIER: {
      const dx = Math.abs(toX - fromX)
      const cpOffset = Math.max(40, dx * 0.5)
      return `M${fromX},${fromY} C${fromX + cpOffset},${fromY} ${toX - cpOffset},${toY} ${toX},${toY}`
    }
    
    case ConnectionCurve.CURVED: {
      const midX = (fromX + toX) / 2
      const midY = (fromY + toY) / 2
      const offset = Math.abs(toY - fromY) * 0.3
      return `M${fromX},${fromY} Q${midX},${midY + offset} ${toX},${toY}`
    }
    
    case ConnectionCurve.ORTHOGONAL: {
      const midX = (fromX + toX) / 2
      return `M${fromX},${fromY} L${midX},${fromY} L${midX},${toY} L${toX},${toY}`
    }
    
    default:
      return `M${fromX},${fromY} L${toX},${toY}`
  }
})
</script>

<style scoped>
.connection-path {
  transition: stroke 0.2s ease, stroke-width 0.2s ease;
  opacity: 0.8;
}

.connection-path:hover {
  opacity: 1;
  stroke-width: 3;
}
</style>
