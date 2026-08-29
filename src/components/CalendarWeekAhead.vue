<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { weatherIcon, type WeatherConfig } from '@/lib/weather'

type CalendarSource = { name: string; color: string; url: string }
type CalendarConfig = { sources: CalendarSource[] }
type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string | null
  allDay: boolean
  source: Pick<CalendarSource, 'name' | 'color'>
}
type ForecastDay = { date: string; high: number; low: number; weatherCode: number }

const props = withDefaults(defineProps<{ config?: CalendarConfig; weatherConfig?: WeatherConfig }>(), {
  config: () => ({ sources: [] }),
  weatherConfig: undefined,
})

const events = ref<CalendarEvent[]>([])
const forecast = ref<ForecastDay[]>([])
const loading = ref(false)
const loadError = ref('')
const today = ref(dayjs())
const days = computed(() => Array.from({ length: 5 }, (_, index) => today.value.add(index, 'day')))
const monthsKey = computed(() => [...new Set(days.value.map((day) => day.format('YYYY-MM')))].join(','))
let dayTimer: ReturnType<typeof setInterval> | undefined

function formatEventTime(event: CalendarEvent) {
  return event.allDay ? 'All day' : dayjs(event.start).format('h:mm A')
}

function eventsForDay(day: dayjs.Dayjs) {
  return events.value.filter((event) => event.start.slice(0, 10) === day.format('YYYY-MM-DD'))
}

function forecastForDay(day: dayjs.Dayjs) {
  return forecast.value.find((item) => item.date === day.format('YYYY-MM-DD'))
}

async function loadEvents() {
  if (!props.config.sources.length) { events.value = []; return }

  loading.value = true
  loadError.value = ''
  const months = [...new Set(days.value.map((day) => day.format('YYYY-MM')))]

  try {
    const responses = await Promise.all(months.map(async (month) => {
      const query = new URLSearchParams({ month })
      props.config.sources.forEach((source) => query.append('source', JSON.stringify(source)))
      const response = await fetch(`/api/calendar?${query}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load calendar.')
      return data as { events: CalendarEvent[]; errors?: unknown[] }
    }))
    events.value = responses.flatMap((response) => response.events)
    if (responses.some((response) => response.errors?.length)) loadError.value = 'Some calendars could not be loaded.'
  } catch (error) {
    events.value = []
    loadError.value = error instanceof Error ? error.message : 'Unable to load calendar.'
  } finally {
    loading.value = false
  }
}

async function loadWeather() {
  if (!props.weatherConfig) { forecast.value = []; return }

  try {
    const query = new URLSearchParams({
      latitude: String(props.weatherConfig.latitude),
      longitude: String(props.weatherConfig.longitude),
      temperatureUnit: props.weatherConfig.temperatureUnit ?? 'fahrenheit',
    })
    const response = await fetch(`/api/weather?${query}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Unable to load weather.')
    forecast.value = data.daily
  } catch {
    forecast.value = []
  }
}

onMounted(() => {
  dayTimer = setInterval(() => { today.value = dayjs() }, 60_000)
})
onBeforeUnmount(() => { if (dayTimer) clearInterval(dayTimer) })
watch(() => [JSON.stringify(props.config.sources), monthsKey.value], loadEvents, { immediate: true })
watch(() => JSON.stringify(props.weatherConfig), loadWeather, { immediate: true })
</script>

<template>
  <section class="flex h-full w-full flex-col bg-background p-4 text-foreground">
    <div class="mb-4 flex items-baseline justify-between gap-4">
      <h2 class="text-5xl font-bold tracking-tight">Next five days</h2>
      <p class="text-2xl text-muted-foreground">{{ days[0].format('MMM D') }} – {{ days[4].format('MMM D') }}</p>
    </div>
    <p v-if="!config.sources.length" class="text-2xl text-muted-foreground">Add calendar sources to the calendar configuration.</p>
    <p v-else-if="loading" class="text-2xl text-muted-foreground">Loading calendar…</p>
    <div v-else class="grid min-h-0 flex-1 grid-cols-5 gap-3">
      <Card v-for="day in days" :key="day.format('YYYY-MM-DD')" :class="['flex min-w-0 flex-col overflow-hidden', day.isSame(dayjs(), 'day') && 'border-2 border-primary']">
        <CardHeader class="shrink-0 border-b pb-3">
          <div class="flex items-center justify-between gap-2">
            <div>
              <CardTitle class="text-3xl font-semibold text-muted-foreground">{{ day.format('dddd') }}</CardTitle>
              <p :class="['text-5xl font-bold', day.isSame(dayjs(), 'day') && 'text-kiosk-orange']">{{ day.format('MMM D') }}</p>
            </div>
            <div v-if="forecastForDay(day)" class="flex shrink-0 items-center gap-2 text-right">
              <component :is="weatherIcon(forecastForDay(day)!.weatherCode)" class="size-12 text-kiosk-orange dark:text-amber-400" />
              <p class="text-2xl font-semibold leading-tight"><span>{{ Math.round(forecastForDay(day)!.high) }}°</span><span class="block font-normal text-muted-foreground">{{ Math.round(forecastForDay(day)!.low) }}°</span></p>
            </div>
          </div>
        </CardHeader>
        <CardContent class="min-h-0 flex-1 space-y-3 overflow-hidden p-3">
          <article v-for="event in eventsForDay(day)" :key="event.id" class="rounded-lg p-3 text-black" :style="{ backgroundColor: event.source.color }">
            <p class="text-2xl font-semibold leading-tight">{{ formatEventTime(event) }}</p>
            <p class="mt-1 text-3xl font-bold leading-tight">{{ event.title }}</p>
          </article>
          <p v-if="!eventsForDay(day).length" class="pt-3 text-2xl text-muted-foreground">No events</p>
        </CardContent>
      </Card>
    </div>
    <p v-if="loadError" class="mt-2 text-xl text-muted-foreground">{{ loadError }}</p>
  </section>
</template>
