<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { CalendarDays, Image } from '@lucide/vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type FeaturedData = {
  date: string
  pictureOfTheDay: { title: string; description: string; image: string | null } | null
  onThisDay: { year: number; text: string }[]
}

const featured = ref<FeaturedData | null>(null)
const error = ref('')

async function loadFeatured() {
  error.value = ''
  try {
    const response = await fetch('/api/wikipedia/featured')
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Unable to load Wikipedia’s daily feature.')
    featured.value = data
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Unable to load Wikipedia’s daily feature.'
  }
}

let refreshTimer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  loadFeatured()
  refreshTimer = setInterval(loadFeatured, 5 * 60 * 1_000)
})
onBeforeUnmount(() => { if (refreshTimer) clearInterval(refreshTimer) })
</script>

<template>
  <section class="h-full w-full bg-background p-4 text-foreground">
    <p v-if="error" class="text-2xl text-destructive">{{ error }}</p>
    <p v-else-if="!featured" class="text-2xl text-muted-foreground">Loading today from Wikipedia…</p>
    <div v-else class="grid h-full grid-cols-2 gap-4">
      <Card class="relative min-h-0 overflow-hidden">
        <CardContent class="h-full p-0">
          <img v-if="featured.pictureOfTheDay?.image" :src="featured.pictureOfTheDay.image" :alt="featured.pictureOfTheDay.title" class="h-full w-full object-cover" loading="lazy" />
          <div v-else class="flex h-full items-center justify-center text-2xl text-muted-foreground">Picture of the day is unavailable.</div>
          <div v-if="featured.pictureOfTheDay" class="absolute inset-x-0 bottom-0 bg-black/75 p-5">
            <p class="flex items-center gap-2 text-2xl font-semibold"><Image class="size-7" />Picture of the day</p>
            <p class="mt-1 text-3xl font-bold leading-tight">{{ featured.pictureOfTheDay.title }}</p>
            <p v-if="featured.pictureOfTheDay.description" class="mt-2 line-clamp-2 text-xl leading-snug text-white/85">{{ featured.pictureOfTheDay.description }}</p>
          </div>
        </CardContent>
      </Card>

      <Card class="flex min-h-0 flex-col overflow-hidden">
          <CardHeader class="pb-2">
            <CardTitle class="flex items-center gap-2 text-4xl"><CalendarDays class="size-9 text-amber-400" />On this day</CardTitle>
          </CardHeader>
          <CardContent v-if="featured.onThisDay.length" class="grid min-h-0 flex-1 grid-rows-2 gap-4">
            <article v-for="event in featured.onThisDay" :key="`${event.year}-${event.text}`" class="grid min-h-0 grid-cols-[auto_1fr] gap-4 overflow-hidden rounded-lg bg-muted/50 p-4">
              <span class="text-4xl font-bold text-amber-300">{{ event.year }}</span>
              <p class="min-w-0 line-clamp-5 text-3xl leading-snug">{{ event.text }}</p>
            </article>
          </CardContent>
          <CardContent v-else class="text-2xl text-muted-foreground">Historical events are unavailable.</CardContent>
      </Card>
    </div>
  </section>
</template>
