<script setup lang="ts">
import Calendar from './components/Calendar.vue'
import KioskCarousel from './components/KioskCarousel.vue'
import Weather from './components/Weather.vue'
import News from './components/News.vue'
import DailyDelights from './components/DailyDelights.vue'
import PhotoFrame from './components/PhotoFrame.vue'
import WikipediaFeatured from './components/WikipediaFeatured.vue'
import { ref } from 'vue'
import { kioskConfig } from './kiosk.config'

const newsPage = ref(0)
const photoPage = ref(-1)
const onSlideChange = (from: number, to: number) => {
  if (from === 2) newsPage.value += 1
  if (to === 4) photoPage.value += 1
}
</script>

<template>
  <KioskCarousel class="dark" :durations="[15_000, 15_000, 15_000, 15_000, 15_000, 15_000, 15_000]" @slide-change="onSlideChange">
    <Calendar :config="kioskConfig.calendar" />
    <Weather :config="kioskConfig.weather" />
    <News :config="kioskConfig.news" :page="newsPage" />
    <Calendar :config="kioskConfig.calendar" />
    <DailyDelights />
    <PhotoFrame title="Family photos" :page="photoPage" />
    <WikipediaFeatured />
  </KioskCarousel>
</template>
