<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { Card, CardContent } from '@/components/ui/card'

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

const props = withDefaults(defineProps<{ config?: CalendarConfig }>(), {
  config: () => ({ sources: [] }),
})
const currentMonth = ref(dayjs())
const events = ref<CalendarEvent[]>([])
const loading = ref(false)
const loadError = ref('')
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const currentMonthName = computed(() => currentMonth.value.format('MMMM YYYY'))

const calendarGrid = computed(() => {
  const startOfGrid = currentMonth.value.startOf('month').startOf('week')
  const endOfGrid = currentMonth.value.endOf('month').endOf('week')
  return Array.from({ length: endOfGrid.diff(startOfGrid, 'day') + 1 }, (_, i) => {
    const day = startOfGrid.add(i, 'day')
    return { dateString: day.format('YYYY-MM-DD'), dayNumber: day.date(), isCurrentMonth: day.month() === currentMonth.value.month(), isToday: day.isSame(dayjs(), 'day') }
  })
})
const gridRowsClass = computed(() => calendarGrid.value.length === 35 ? 'grid-rows-5' : 'grid-rows-6')
const eventsForDay = (date: string) => events.value.filter((event) => event.start.slice(0, 10) === date)
const formatEventTime = (event: CalendarEvent) => event.allDay ? '' : `${dayjs(event.start).format('h:mm A')} `

async function loadEvents() {
  if (!props.config.sources.length) { events.value = []; return }
  loading.value = true
  loadError.value = ''
  const query = new URLSearchParams({ month: currentMonth.value.format('YYYY-MM') })
  props.config.sources.forEach((source) => query.append('source', JSON.stringify(source)))
  try {
    const response = await fetch(`/api/calendar?${query}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Unable to load calendar.')
    events.value = data.events
    if (data.errors?.length) loadError.value = 'Some calendars could not be loaded.'
  } catch (error) {
    events.value = []
    loadError.value = error instanceof Error ? error.message : 'Unable to load calendar.'
  } finally { loading.value = false }
}

watch(() => [currentMonth.value.format('YYYY-MM'), JSON.stringify(props.config.sources)], loadEvents, { immediate: true })
</script>

<template>
  <div class="flex flex-col h-full w-full bg-background p-3 select-none text-foreground">
    <div class="pb-1"><h2 class="text-4xl font-bold tracking-tight">{{ currentMonthName }}</h2></div>
    <p v-if="!config.sources.length" class="pb-1 text-xl text-muted-foreground">Add calendar sources to the calendar configuration.</p>
    <p v-else-if="loading || loadError" class="pb-1 text-xl text-muted-foreground">{{ loading ? 'Loading calendars…' : loadError }}</p>
    <div class="grid grid-cols-7 gap-0.5 pb-1 text-center text-xl font-semibold text-muted-foreground"><div v-for="day in daysOfWeek" :key="day">{{ day }}</div></div>
    <div :class="['grid grid-cols-7 gap-0.5 flex-1 min-h-0', gridRowsClass]">
      <Card v-for="day in calendarGrid" :key="day.dateString" :class="['h-full py-0 flex flex-col shadow-sm border', day.isToday && 'border-2 border-primary', !day.isCurrentMonth && 'opacity-30 bg-muted/20']">
        <CardContent class="p-1.5 h-full flex flex-col min-h-0">
          <div class="flex min-w-0 items-center gap-1">
            <span :class="['text-2xl font-medium w-9 h-9 flex items-center justify-center shrink-0', day.isToday && 'bg-primary text-primary-foreground rounded-full font-semibold']">{{ day.dayNumber }}</span>
            <div v-if="eventsForDay(day.dateString)[0]" class="min-w-0 flex-1">
              <div class="truncate rounded px-1 py-px text-xl leading-tight text-black" :style="{ backgroundColor: eventsForDay(day.dateString)[0].source.color }" :title="`${eventsForDay(day.dateString)[0].source.name}: ${eventsForDay(day.dateString)[0].title}`">
                {{ formatEventTime(eventsForDay(day.dateString)[0]) }}{{ eventsForDay(day.dateString)[0].title }}
              </div>
            </div>
          </div>
          <div class="mt-0.5 flex-1 space-y-0.5 overflow-hidden">
            <div v-for="event in eventsForDay(day.dateString).slice(1)" :key="event.id" class="truncate rounded px-1 py-px text-xl leading-tight text-black" :style="{ backgroundColor: event.source.color }" :title="`${event.source.name}: ${event.title}`">
              {{ formatEventTime(event) }}{{ event.title }}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
