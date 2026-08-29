<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { BookOpen, Quote, Sparkles } from '@lucide/vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type DailyData = { puppy: { image: string | null }; quote: { text: string; author: string }; word: { word: string; phonetic: string; partOfSpeech: string; definition: string } }
const daily = ref<DailyData | null>(null)
const error = ref('')

onMounted(async () => {
  try {
    const response = await fetch('/api/daily')
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Unable to load daily delights.')
    daily.value = data
  } catch (caught) { error.value = caught instanceof Error ? caught.message : 'Unable to load daily delights.' }
})
</script>

<template>
  <section class="h-full w-full bg-background p-4 text-foreground">
    <div class="mb-4 flex items-center gap-2"><Sparkles class="size-8 text-kiosk-orange dark:text-amber-400" /><h2 class="text-4xl font-bold tracking-tight">Daily delights</h2></div>
    <p v-if="error" class="text-destructive">{{ error }}</p>
    <div v-else-if="daily" class="grid h-[calc(100%-3rem)] grid-cols-1 gap-4 lg:grid-cols-2">
      <Card class="overflow-hidden"><CardContent class="flex h-full items-center justify-center p-0"><img v-if="daily.puppy.image" :src="daily.puppy.image" alt="Puppy of the day" class="h-full w-full object-cover" loading="lazy" /><p v-else class="text-2xl text-muted-foreground">Puppy of the Day is taking a nap.</p></CardContent></Card>
      <div class="grid min-h-0 grid-rows-2 gap-4">
        <Card><CardHeader class="pb-2"><CardTitle class="flex items-center gap-2 text-3xl"><Quote class="size-9 text-kiosk-orange dark:text-amber-400" />Quote of the day</CardTitle></CardHeader><CardContent><blockquote class="text-5xl font-medium leading-snug">“{{ daily.quote.text }}”</blockquote><p class="mt-3 text-3xl text-muted-foreground">— {{ daily.quote.author }}</p><p class="mt-4 text-xl text-muted-foreground">Quotes provided by ZenQuotes</p></CardContent></Card>
        <Card><CardHeader class="pb-2"><CardTitle class="flex items-center gap-2 text-3xl"><BookOpen class="size-9 text-sky-500" />Word of the day</CardTitle></CardHeader><CardContent><p class="text-6xl font-semibold">{{ daily.word.word }} <span v-if="daily.word.phonetic" class="text-3xl font-normal text-muted-foreground">{{ daily.word.phonetic }}</span></p><p class="mt-2 text-2xl italic text-muted-foreground">{{ daily.word.partOfSpeech }}</p><p class="mt-4 text-4xl leading-snug">{{ daily.word.definition }}</p></CardContent></Card>
      </div>
    </div>
    <p v-else class="text-muted-foreground">Loading daily delights…</p>
  </section>
</template>
