<script setup lang="ts">
import Calendar from './components/Calendar.vue'
import CalendarWeekAhead from './components/CalendarWeekAhead.vue'
import KioskCarousel from './components/KioskCarousel.vue'
import Weather from './components/Weather.vue'
import News from './components/News.vue'
import DailyDelights from './components/DailyDelights.vue'
import PhotoFrame from './components/PhotoFrame.vue'
import WikipediaFeatured from './components/WikipediaFeatured.vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { kioskConfig } from './kiosk.config'

const newsPage = ref(0)
const photoPage = ref(-1)
const designWidth = 1920
const designHeight = 1080
const designRootFontSize = 16

function updateKioskScale() {
  const scale = Math.min(window.innerWidth / designWidth, window.innerHeight / designHeight)
  document.documentElement.style.setProperty('--kiosk-rem', `${designRootFontSize * scale}px`)
}

onMounted(() => {
  updateKioskScale()
  window.addEventListener('resize', updateKioskScale)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateKioskScale)
  document.documentElement.style.removeProperty('--kiosk-rem')
})

const onSlideChange = (from: number, to: number) => {
  if (from === 3) newsPage.value += 1
  if (to === 7) photoPage.value += 1
}
</script>

<template>
  <KioskCarousel class="" :durations="[15_000, 15_000, 15_000, 15_000, 15_000, 15_000, 15_000, 15_000, 15_000]" @slide-change="onSlideChange">
    <Calendar :config="kioskConfig.calendar" />
    <CalendarWeekAhead :config="kioskConfig.calendar" :weather-config="kioskConfig.weather" />
    <Weather :config="kioskConfig.weather" />
    <News :config="kioskConfig.news" :page="newsPage" />
    <Calendar :config="kioskConfig.calendar" />
    <CalendarWeekAhead :config="kioskConfig.calendar" :weather-config="kioskConfig.weather" />
    <DailyDelights />
    <PhotoFrame title="Family photos" :page="photoPage" />
    <WikipediaFeatured />
  </KioskCarousel>
</template>
