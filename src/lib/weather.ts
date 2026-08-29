import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Moon, Sun } from '@lucide/vue'

export type WeatherConfig = {
  latitude: number
  longitude: number
  name?: string
  temperatureUnit?: 'fahrenheit' | 'celsius'
}

export function weatherIcon(code: number, isDay = true) {
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
