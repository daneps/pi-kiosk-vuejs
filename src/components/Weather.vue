<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import { AlertTriangle, Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Droplets, Moon, Sun } from '@lucide/vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type WeatherConfig = { latitude: number; longitude: number; name?: string; temperatureUnit?: 'fahrenheit' | 'celsius' }
type Hour = { time: string; temperature: number; precipitationProbability: number; weatherCode: number }
type Day = { date: string; high: number; low: number; weatherCode: number; sunrise: string; sunset: string }
type WeatherAlert = { id: string; event: string; headline: string; severity: string; urgency: string; expires: string | null }
type WeatherData = { timezone: string; units: { temperature: string; precipitation: string }; current: { temperature: number; feelsLike: number; weatherCode: number; isDay: boolean }; alerts: WeatherAlert[]; today: Day; hourly: Hour[]; daily: Day[] }

const props = defineProps<{ config: WeatherConfig }>()
const weather = ref<WeatherData | null>(null)
const error = ref('')
const loading = ref(true)
const now = ref(dayjs())
function weatherIcon(code: number, isDay = true) {
  if (code === 0) return isDay ? Sun : Moon
  if (code <= 2) return isDay ? CloudSun : CloudMoon
  if (code === 3) return Cloud
  if (code === 45 || code === 48) return CloudFog
  if ([51, 53, 55, 56, 57].includes(code)) return CloudDrizzle
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return CloudRain
  if ([71, 73, 75, 77, 85, 86].includes(code)) return CloudSnow
  if ([95, 96, 99].includes(code)) return CloudLightning
  return Cloud
}

function alertStyle(severity: string) {
  return ['Extreme', 'Severe'].includes(severity)
    ? 'border-red-500 bg-red-500/15 text-red-100'
    : 'border-amber-400 bg-amber-400/15 text-amber-50'
}

async function loadWeather() {
  loading.value = true
  error.value = ''
  try {
    const query = new URLSearchParams({ latitude: String(props.config.latitude), longitude: String(props.config.longitude), temperatureUnit: props.config.temperatureUnit ?? 'fahrenheit' })
    const response = await fetch(`/api/weather?${query}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Unable to load weather.')
    weather.value = data
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Unable to load weather.'
  } finally { loading.value = false }
}

let refreshTimer: ReturnType<typeof setInterval> | undefined
let clockTimer: ReturnType<typeof setInterval> | undefined
onMounted(() => { loadWeather(); refreshTimer = setInterval(loadWeather, 30 * 60 * 1_000); clockTimer = setInterval(() => { now.value = dayjs() }, 1_000) })
onBeforeUnmount(() => { if (refreshTimer) clearInterval(refreshTimer); if (clockTimer) clearInterval(clockTimer) })
</script>

<template>
  <section class="flex h-full w-full flex-col bg-background p-4 text-foreground">
    <div class="mb-4 flex items-baseline justify-between">
      <h2 class="text-4xl font-bold tracking-tight">Weather<span v-if="config.name" class="text-muted-foreground"> · {{ config.name }}</span></h2>
      <div class="text-right text-2xl text-muted-foreground"><p>{{ now.format('dddd, MMMM D') }}</p><p class="font-medium text-foreground">{{ now.format('h:mm:ss A') }}</p></div>
    </div>
    <p v-if="loading && !weather" class="text-muted-foreground">Loading weather…</p>
    <p v-else-if="error" class="text-destructive">{{ error }}</p>
    <template v-else-if="weather">
      <div v-if="weather.alerts.length" class="mb-4 shrink-0 space-y-2">
        <article v-for="alert in weather.alerts.slice(0, 2)" :key="alert.id" :class="['flex items-center gap-3 rounded-lg border-2 p-3', alertStyle(alert.severity)]">
          <AlertTriangle class="size-10 shrink-0" />
          <div class="min-w-0"><p class="text-3xl font-bold">{{ alert.event }}</p><p v-if="alert.headline" class="truncate text-2xl">{{ alert.headline }}</p></div>
        </article>
      </div>
      <div class="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        <Card class="lg:col-span-1"><CardContent class="flex h-full flex-col justify-between p-6">
          <div class="flex items-center justify-between"><div><p class="text-2xl text-muted-foreground">Now</p><p class="text-[10rem] font-semibold tracking-tighter">{{ Math.round(weather.current.temperature) }}°</p><p class="text-2xl text-muted-foreground">Feels like {{ Math.round(weather.current.feelsLike) }}°</p></div><component :is="weatherIcon(weather.current.weatherCode, weather.current.isDay)" class="size-24 text-amber-500" /></div>
          <div class="space-y-3"><div class="flex gap-6 text-3xl"><span>H <strong>{{ Math.round(weather.today.high) }}°</strong></span><span>L <strong>{{ Math.round(weather.today.low) }}°</strong></span></div><div class="flex gap-5 text-2xl text-muted-foreground"><span>↑ {{ dayjs(weather.today.sunrise).format('h:mm A') }}</span><span>↓ {{ dayjs(weather.today.sunset).format('h:mm A') }}</span></div></div>
        </CardContent></Card>

        <Card class="min-h-0 lg:col-span-2"><CardHeader class="pb-2"><CardTitle class="text-3xl">Next 12 hours</CardTitle></CardHeader><CardContent class="grid h-[calc(100%-3.5rem)] min-h-0 grid-cols-12 gap-2 px-4 pb-4">
          <article v-for="hour in weather.hourly" :key="hour.time" class="flex min-w-0 flex-col overflow-hidden rounded-md bg-muted/40 p-2 text-center">
            <time class="text-2xl font-medium text-muted-foreground">{{ dayjs(hour.time).format('ha') }}</time>
            <div class="relative mt-2 min-h-0 flex-1 overflow-hidden rounded-sm bg-sky-950/50">
              <div class="absolute inset-x-0 bottom-0 bg-sky-500/80" :style="{ height: `${hour.precipitationProbability}%` }" />
              <span class="absolute inset-x-0 bottom-1 z-10 text-2xl font-bold text-white">{{ Math.round(hour.precipitationProbability) }}%</span>
            </div>
            <div class="mt-2 flex flex-col items-center justify-center gap-1"><component :is="weatherIcon(hour.weatherCode)" class="size-10 shrink-0 text-sky-300" /><span class="text-4xl font-semibold">{{ Math.round(hour.temperature) }}°</span></div>
            <div class="mt-1 flex items-center justify-center gap-1 text-2xl font-semibold text-sky-300"><Droplets class="size-6" /><span>{{ Math.round(hour.precipitationProbability) }}%</span></div>
          </article>
        </CardContent></Card>

        <Card class="lg:col-span-3"><CardHeader class="pb-2"><CardTitle class="text-3xl">Five-day forecast</CardTitle></CardHeader><CardContent class="grid grid-cols-5 gap-3 pb-5">
          <div v-for="day in weather.daily" :key="day.date" class="flex flex-col items-center gap-3 rounded-md bg-muted/40 p-4 text-center"><span class="text-3xl font-medium">{{ dayjs(day.date).format('ddd') }}</span><component :is="weatherIcon(day.weatherCode)" class="size-20 text-amber-500" /><span class="text-4xl font-semibold">{{ Math.round(day.high) }}° <span class="font-normal text-muted-foreground">{{ Math.round(day.low) }}°</span></span></div>
        </CardContent></Card>
      </div>
    </template>
  </section>
</template>
