<script setup lang="ts">
import { ref, watch } from 'vue'
import { ImageOff } from '@lucide/vue'

const props = withDefaults(defineProps<{ title?: string; page: number }>(), { title: 'Family photos' })
const image = ref('')
const error = ref('')

async function loadPhoto() {
  error.value = ''
  try {
    const query = image.value ? `?exclude=${encodeURIComponent(image.value)}` : ''
    const response = await fetch(`/api/photos/random${query}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Unable to load a photo.')
    image.value = data.image
  } catch (caught) { error.value = caught instanceof Error ? caught.message : 'Unable to load a photo.' }
}

watch(() => props.page, (page) => { if (page >= 0) loadPhoto() }, { immediate: true })
</script>

<template>
  <section class="relative h-full w-full bg-black text-white">
    <img v-if="image" :src="image" :alt="title" class="h-full w-full object-contain" />
    <div v-else class="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground"><ImageOff class="size-16" /><p>{{ error || 'Loading photo…' }}</p></div>
    <div v-if="image" class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-6 py-8"><h2 class="text-4xl font-semibold">{{ title }}</h2></div>
  </section>
</template>
