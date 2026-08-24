import { Router } from 'express';
import { CalendarStore } from '../stores/calendar.store.js';
import { CalendarService } from '../services/calendar.service.js';
import { CalendarController } from '../controllers/calendar.controller.js';
import { WeatherStore } from '../stores/weather.store.js';
import { WeatherService } from '../services/weather.service.js';
import { WeatherController } from '../controllers/weather.controller.js';
import { NewsStore } from '../stores/news.store.js';
import { NewsService } from '../services/news.service.js';
import { NewsController } from '../controllers/news.controller.js';
import { DailyStore } from '../stores/daily.store.js';
import { DailyService } from '../services/daily.service.js';
import { DailyController } from '../controllers/daily.controller.js';
import { PhotoStore } from '../stores/photo.store.js';
import { PhotoService } from '../services/photo.service.js';
import { PhotoController } from '../controllers/photo.controller.js';
import { WikimediaStore } from '../stores/wikimedia.store.js';
import { WikimediaService } from '../services/wikimedia.service.js';
import { WikimediaController } from '../controllers/wikimedia.controller.js';

// 1. Initialize the Router instance
const router = Router();

// 2. Instantiate dependencies (Dependency Injection)
const calendarStore = new CalendarStore();
const calendarService = new CalendarService(calendarStore);
const calendarController = new CalendarController(calendarService);
const weatherController = new WeatherController(new WeatherService(new WeatherStore()));
const newsController = new NewsController(new NewsService(new NewsStore()));
const dailyController = new DailyController(new DailyService(new DailyStore()));
const photoController = new PhotoController(new PhotoService(new PhotoStore()));
const wikimediaController = new WikimediaController(new WikimediaService(new WikimediaStore()));

// 3. Define the routing endpoints
// Express handles these sequentially from top to bottom
router.get('/calendar', calendarController.getCalendarEvents);
router.get('/weather', weatherController.getWeather);
router.get('/news', newsController.getHeadlines);
router.get('/daily', dailyController.getDaily);
router.get('/photos/random', photoController.getRandomPhoto);
router.get('/wikipedia/featured', wikimediaController.getFeatured);

// 4. Export the configured router instance
export default router;
