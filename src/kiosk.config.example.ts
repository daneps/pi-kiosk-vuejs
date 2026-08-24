export const kioskConfig = {
  weather: {
    name: 'Example location',
    latitude: 40.7128,
    longitude: -74.006,
    temperatureUnit: 'fahrenheit' as const,
  },
  news: {
    sources: [
      { name: 'Associated Press', url: 'https://news.google.com/rss/search?q=site%3Aapnews.com&hl=en-US&gl=US&ceid=US%3Aen' },
      { name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml' },
      { name: 'Reuters', url: 'https://news.google.com/rss/search?q=site%3Areuters.com&hl=en-US&gl=US&ceid=US%3Aen' },
    ],
  },
  calendar: {
    sources: [
      { name: 'Personal', color: '#2563eb', url: 'https://example.com/personal-calendar.ics' },
      { name: 'Work', color: '#ba25eb', url: 'https://example.com/work-calendar.ics' },
    ],
  },
}
