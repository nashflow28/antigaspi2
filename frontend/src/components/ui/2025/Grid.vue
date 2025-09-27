<template>
  <div :class="gridClasses" :style="gridStyle">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Types
export type GridCols = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto' | 'none'
export type GridGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type GridAlign = 'start' | 'end' | 'center' | 'stretch'
export type GridJustify = 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'

// Props
interface Props {
  cols?: GridCols
  colsSm?: GridCols
  colsMd?: GridCols
  colsLg?: GridCols
  colsXl?: GridCols
  gap?: GridGap
  gapX?: GridGap
  gapY?: GridGap
  alignItems?: GridAlign
  justifyItems?: GridJustify
  autoRows?: string
  autoCols?: string
  templateRows?: string
  templateCols?: string
}

const props = withDefaults(defineProps<Props>(), {
  cols: 'auto',
  gap: 'md',
  alignItems: 'stretch',
  justifyItems: 'start'
})

// Computed
const gridClasses = computed(() => {
  const classes = ['grid']

  // Grid columns
  if (props.cols !== 'none') {
    if (props.cols === 'auto') {
      classes.push('grid-cols-auto')
    } else {
      classes.push(`grid-cols-${props.cols}`)
    }
  }

  // Responsive columns
  if (props.colsSm) {
    classes.push(`sm:grid-cols-${props.colsSm}`)
  }
  if (props.colsMd) {
    classes.push(`md:grid-cols-${props.colsMd}`)
  }
  if (props.colsLg) {
    classes.push(`lg:grid-cols-${props.colsLg}`)
  }
  if (props.colsXl) {
    classes.push(`xl:grid-cols-${props.colsXl}`)
  }

  // Gap
  if (props.gap && props.gap !== 'none') {
    classes.push(getGapClass('gap', props.gap))
  }
  if (props.gapX && props.gapX !== 'none') {
    classes.push(getGapClass('gap-x', props.gapX))
  }
  if (props.gapY && props.gapY !== 'none') {
    classes.push(getGapClass('gap-y', props.gapY))
  }

  // Alignment
  if (props.alignItems !== 'stretch') {
    classes.push(`items-${props.alignItems}`)
  }

  if (props.justifyItems !== 'start') {
    classes.push(`justify-items-${props.justifyItems}`)
  }

  return classes.join(' ')
})

const gridStyle = computed(() => {
  const style: Record<string, string> = {}

  if (props.autoRows) {
    style.gridAutoRows = props.autoRows
  }

  if (props.autoCols) {
    style.gridAutoColumns = props.autoCols
  }

  if (props.templateRows) {
    style.gridTemplateRows = props.templateRows
  }

  if (props.templateCols) {
    style.gridTemplateColumns = props.templateCols
  }

  return style
})

// Methods
const getGapClass = (prefix: string, size: GridGap) => {
  if (size === 'none') return ''

  const sizes: Record<Exclude<GridGap, 'none'>, string> = {
    xs: '1',
    sm: '2',
    md: '4',
    lg: '6',
    xl: '8'
  }
  return `${prefix}-${sizes[size]}`
}
</script>

<style scoped>
.grid-cols-auto {
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
}
</style>
