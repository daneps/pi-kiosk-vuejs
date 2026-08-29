<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'

const props = withDefaults(defineProps<{ intervalMs?: number; durations?: number[] }>(), { intervalMs: 15_000, durations: () => [] })
const emit = defineEmits<{ slideChange: [from: number, to: number] }>()
const slots = useSlots()
const activeIndex = ref(0)
const isBlack = ref(false)
const isTransitioning = ref(false)
const slides = computed(() => slots.default?.() ?? [])
let timer: ReturnType<typeof setTimeout> | undefined
let transitionTimer: ReturnType<typeof setTimeout> | undefined
const fadeDurationMs = 200
const blackHoldMs = 75

function scheduleNextSlide() {
  if (timer) clearTimeout(timer)
  if (slides.value.length > 1) timer = setTimeout(advanceSlide, props.durations[activeIndex.value] ?? props.intervalMs)
}

function changeSlide(direction: 1 | -1) {
  if (isTransitioning.value || slides.value.length < 2) return
  if (timer) clearTimeout(timer)
  isTransitioning.value = true
  isBlack.value = true
  transitionTimer = setTimeout(() => {
    activeIndex.value = (activeIndex.value + direction + slides.value.length) % slides.value.length
    transitionTimer = setTimeout(() => {
      isBlack.value = false
      isTransitioning.value = false
      scheduleNextSlide()
    }, blackHoldMs)
  }, fadeDurationMs)
}

function advanceSlide() { changeSlide(1) }

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  event.preventDefault()
  changeSlide(event.key === 'ArrowLeft' ? -1 : 1)
}

onMounted(() => {
  scheduleNextSlide()
  window.addEventListener('keydown', handleKeydown)
})
watch(activeIndex, (index, previousIndex) => { emit('slideChange', previousIndex, index) })
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
  if (transitionTimer) clearTimeout(transitionTimer)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <main class="relative h-screen w-screen overflow-hidden">
    <section v-for="(slide, index) in slides" :key="index" :class="['absolute inset-0 h-full w-full', index === activeIndex ? 'z-10' : 'pointer-events-none hidden']"><component :is="slide" /></section>
    <div :class="['pointer-events-none absolute inset-0 z-20 bg-black transition-opacity duration-200 ease-in-out', isBlack ? 'opacity-100' : 'opacity-0']" />
  </main>
</template>
