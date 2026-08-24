<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'

const props = withDefaults(defineProps<{ intervalMs?: number; durations?: number[] }>(), { intervalMs: 15_000, durations: () => [] })
const emit = defineEmits<{ slideChange: [from: number, to: number] }>()
const slots = useSlots()
const activeIndex = ref(0)
const isBlack = ref(false)
const slides = computed(() => slots.default?.() ?? [])
let timer: ReturnType<typeof setTimeout> | undefined
let transitionTimer: ReturnType<typeof setTimeout> | undefined
const fadeDurationMs = 200
const blackHoldMs = 75

function scheduleNextSlide() {
  if (timer) clearTimeout(timer)
  if (slides.value.length > 1) timer = setTimeout(advanceSlide, props.durations[activeIndex.value] ?? props.intervalMs)
}

function advanceSlide() {
  isBlack.value = true
  transitionTimer = setTimeout(() => {
    activeIndex.value = (activeIndex.value + 1) % slides.value.length
    transitionTimer = setTimeout(() => { isBlack.value = false }, blackHoldMs)
  }, fadeDurationMs)
}
onMounted(scheduleNextSlide)
watch(activeIndex, (index, previousIndex) => { emit('slideChange', previousIndex, index); scheduleNextSlide() })
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
  if (transitionTimer) clearTimeout(transitionTimer)
})
</script>

<template>
  <main class="relative h-screen w-screen overflow-hidden">
    <section v-for="(slide, index) in slides" :key="index" :class="['absolute inset-0 h-full w-full', index === activeIndex ? 'z-10' : 'pointer-events-none hidden']"><component :is="slide" /></section>
    <div :class="['pointer-events-none absolute inset-0 z-20 bg-black transition-opacity duration-200 ease-in-out', isBlack ? 'opacity-100' : 'opacity-0']" />
  </main>
</template>
