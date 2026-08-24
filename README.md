# Pi kiosk calendar

Configure widgets in an untracked `src/kiosk.config.ts` file. Start by copying `src/kiosk.config.example.ts`; keep private calendar URLs and location settings only in the untracked file. The carousel rotates between calendar, weather, and news every 15 seconds with a fade, and its Open-Meteo response is cached by Express for 30 minutes.

```sh
cp src/kiosk.config.example.ts src/kiosk.config.ts
```

## Sharing safely

The Git ignore rules exclude `src/kiosk.config.ts`, all `.env` files, private keys, local photo data, IDE metadata, dependencies, and build output. Do not force-add ignored files. This working directory still contains your ignored local configuration and photos, so share it through Git (or a fresh clone), not by zipping the working directory.

News sources are configured as RSS feeds (`Associated Press`, `NPR`, and `Reuters` are included). AP and Reuters use Google News RSS queries because their legacy public feeds are no longer reliably available; replace these source URLs with direct feeds if you have licensed access. The backend caches parsed feeds for 15 minutes. News shows a stable page of four headlines during its carousel dwell, then advances to the next set on its next appearance. Images are never cached or copied by the server—the active article loads its remote image lazily, keeping the Pi's memory footprint bounded.

Daily Delights adds a Puppy of the Day, quote, and word/definition. The server requests their APIs at most once per UTC day and retains only the puppy's remote image URL—not the image bytes.

Wikipedia’s daily view displays the Picture of the Day and two selected “On this day” events. It requests the Wikimedia daily feed server-side once per UTC day and sends an identifiable User-Agent; set `WIKIMEDIA_USER_AGENT` in the Pi’s server environment to override it with a contactable application identifier.

The Weather view uses Open-Meteo for forecast data and the official NWS point-alert endpoint for active U.S. watches, warnings, and advisories. Alerts are refreshed server-side every five minutes and appear above the forecast when active. Set `NWS_USER_AGENT` in the Pi’s server environment to override its identifiable User-Agent.

## Personal photo frame

Set `PHOTO_SYNC_SOURCE` to a curated local folder or an rsync remote, then run:

```sh
PHOTO_SYNC_SOURCE='user@photo-host:/path/to/photos/' pnpm photos:sync
```

`photos:sync` mirrors the selected files to `backend/data/photos/source/`, then creates 1920×1080-or-smaller JPEGs (quality 80) in `backend/data/photos/optimized/`. Both folders are ignored by Git. Deploy after syncing to copy the optimized images to the Pi; source images are excluded from Pi deployment.

## Deploying to the Pi

Build, copy the app, refresh dependencies, restart the API, and relaunch the kiosk browser with one command. Set the target first:

```bash
PI_HOST='pi@raspberrypi.local' npm run deploy:pi
```

To use a non-default app directory or a particular SSH key, set `PI_APP_DIR` and `PI_SSH_KEY`:

```bash
PI_HOST='pi@raspberrypi.local' PI_APP_DIR='/home/pi/pi-kiosk-vuejs' PI_SSH_KEY="$HOME/.ssh/pi-kiosk" npm run deploy:pi
```

The deploy script builds the SPA, mirrors the application to the Pi (excluding source photos, Git metadata, environment files, and dependencies), installs production dependencies, reloads the `pi-kiosk-api` PM2 process, and relaunches Chromium. The kiosk serves only the optimized photo files and picks a new photo each time the carousel reaches that page.

## TV schedule and Pi power

The Raspberry Pi 3 is powered from the Roku TV's USB utility port. That USB port remains powered while the TV is in standby, so the Pi stays online and can send CEC commands at the next scheduled start time.

The kiosk user's crontab on the Pi contains this daily schedule, using the Pi's local Eastern Time timezone (including daylight-saving changes):

```cron
# pi-kiosk-tv-schedule
30 6 * * * /usr/bin/cec-ctl --to 0 --image-view-on && /bin/sleep 2 && /usr/bin/cec-ctl --active-source phys-addr=1.0.0.0 # pi-kiosk-tv-schedule
30 8 * * * /usr/bin/cec-ctl --to 0 --standby # pi-kiosk-tv-schedule
0 17 * * * /usr/bin/cec-ctl --to 0 --image-view-on && /bin/sleep 2 && /usr/bin/cec-ctl --active-source phys-addr=1.0.0.0 # pi-kiosk-tv-schedule
0 21 * * * /usr/bin/cec-ctl --to 0 --standby # pi-kiosk-tv-schedule
```

This turns the TV on and selects HDMI 1 at 6:30 AM and 5:00 PM, then puts it into standby at 8:30 AM and 9:00 PM. Check the installed schedule with `crontab -l` while logged in as the kiosk user.

Do not halt or cut power to the Pi between these windows: the Pi 3 has no built-in timed wake-from-sleep capability, and it must remain running for cron to wake the TV via CEC. The CEC standby schedule is the safe low-power approach; the TV is off while the Pi remains idle. Meaningfully powering down the Pi would require external timed-wake hardware (for example, an RTC/power controller) and a safe shutdown before power is removed.

```ts
const calConfig = {
  sources: [
    { name: 'Family', color: '#2563eb', url: 'https://example.com/family.ics' },
    { name: 'Work', color: '#dc2626', url: 'https://example.com/work.ics' },
  ],
}
```

Each event is colored with its source color. The kiosk intentionally has no navigation controls.

For development, start the API and Vite in separate terminals:

```sh
pnpm server
pnpm dev
```

Vite proxies `/api` to Express on port 3000. For the Pi, build the SPA and start Express; it serves both `/api` and `dist`:

```sh
pnpm build
pnpm start
```

The SPA calls `GET /api/calendar?month=YYYY-MM&source=...` once for the current month. Express downloads and parses the ICS feeds, caches each feed for five minutes, and returns only the visible calendar-grid events. Configure this kiosk server on a trusted network: the API fetches the HTTP(S) URLs passed by the configured frontend.
