<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Card, CardContent } from '@/components/ui/card'

dayjs.extend(relativeTime)
type NewsSource = { name: string; url: string }
type Article = { id: string; source: string; title: string; link: string; publishedAt: string | null; summary: string }
const props = defineProps<{ config: { sources: NewsSource[] }; page?: number }>()
const articles = ref<Article[]>([])
const error = ref('')
const visibleArticles = computed(() => {
  const count = Math.min(4, articles.value.length)
  const startIndex = ((props.page ?? 0) * count) % articles.value.length
  return Array.from({ length: count }, (_, index) => articles.value[(startIndex + index) % articles.value.length])
})

async function loadHeadlines() {
  const query = new URLSearchParams()
  props.config.sources.forEach((source) => query.append('source', JSON.stringify(source)))
  try {
    const response = await fetch(`/api/news?${query}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Unable to load headlines.')
    articles.value = data.articles
    if (data.errors?.length) error.value = 'Some news feeds could not be loaded.'
  } catch (caught) { error.value = caught instanceof Error ? caught.message : 'Unable to load headlines.' }
}

let refreshTimer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  loadHeadlines()
  refreshTimer = setInterval(loadHeadlines, 15 * 60 * 1_000)
})
onBeforeUnmount(() => { if (refreshTimer) clearInterval(refreshTimer) })

</script>

<template>
  <section class="flex h-full w-full flex-col bg-background p-4 text-foreground">
    <h2 class="mb-4 text-4xl font-bold tracking-tight">Top headlines</h2>
    <p v-if="error && !visibleArticles.length" class="text-destructive">{{ error }}</p>
    <Transition name="headline-fade" mode="out-in">
      <div v-if="visibleArticles.length" :key="page" class="grid flex-1 grid-cols-2 grid-rows-2 gap-4">
        <Card v-for="article in visibleArticles" :key="article.id" class="min-h-0 overflow-hidden bg-muted/50"><CardContent class="flex h-full min-h-0 flex-col p-4">
          <div class="flex items-baseline justify-between gap-3"><p class="text-2xl font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">{{ article.source }}</p><p v-if="article.publishedAt" class="shrink-0 text-xl text-muted-foreground">{{ dayjs(article.publishedAt).fromNow() }}</p></div>
          <h3 class="mt-3 line-clamp-3 text-4xl font-semibold leading-tight">{{ article.title }}</h3>
          <p v-if="article.summary" class="mt-4 line-clamp-4 text-2xl leading-snug text-muted-foreground">{{ article.summary }}</p>
        </CardContent></Card>
      </div>
      <Card v-else key="empty" class="flex flex-1 items-center justify-center"><CardContent class="text-muted-foreground">Loading headlines…</CardContent></Card>
    </Transition>
    <p v-if="error && visibleArticles.length" class="mt-1 text-xl text-muted-foreground">{{ error }}</p>
  </section>
</template>

<style scoped>
.headline-fade-enter-active, .headline-fade-leave-active { transition: opacity 450ms ease; }
.headline-fade-enter-from, .headline-fade-leave-to { opacity: 0; }
</style>
