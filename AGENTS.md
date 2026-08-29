# Pi kiosk operations

## Private connection configuration

This project’s Pi connection settings live in the untracked `.pi-kiosk.env` file. Copy `.pi-kiosk.env.example` if it is absent. Never commit, print, or add the contents of `.pi-kiosk.env` to documentation; it may identify a private host and SSH key.

All Pi maintenance commands below reuse that file. Use them instead of asking the user to paste a long SSH command. They require network/SSH access, so obtain any required execution approval.

## Diagnostics and recovery

Run these from the project root, in this order when investigating a kiosk problem:

```sh
npm run pi:diagnose         # API, cron, PM2, Chromium, labwc, and HDMI state
npm run pi:diagnose -- --logs # Adds browser/API logs and current-boot warnings
npm run pi:screenshot       # Copies the Pi's DISPLAY=:0 capture to /private/tmp
npm run pi:restart-browser  # Restarts Chromium only; preserves its profile/cache
```

The screenshot path is printed by the command; inspect that saved image before treating it as evidence of the TV’s physical output. A black/white screenshot can indicate a display/compositor problem, but does not prove the browser cache is corrupt.

`npm run pi:watchdog:install` installs/updates a user-cron watchdog that runs every two minutes. It checks the local API, Chromium process, and Chromium debugging endpoint; on failure it restarts Chromium only, with a five-minute cooldown. It does **not** currently detect a fully responsive Chromium process that paints an all-black/all-white screen.

Do not clear Chromium’s profile/cache or reboot the Pi as the first recovery step. Prefer `pi:restart-browser`; inspect logs if the failure repeats.

## Deployment and TV power

`npm run deploy:pi` uses `.pi-kiosk.env`, builds the app, syncs it to the Pi, reloads the PM2 API, and restarts Chromium. Do not deploy merely to diagnose a live display issue; deploy only when changes are intended.

The Pi 3 is powered through the Roku TV USB utility port and needs to remain powered for its user crontab to send CEC TV wake commands. If that USB port has lost power, the Pi cannot run cron or wake the TV. The configured CEC schedule is 6:30–8:30 AM and 5:00–9:00 PM, local Eastern time. Use `npm run pi:tv-schedule:install` to install it; it configures the CEC adapter as a playback device on every action and logs results to `/tmp/pi-kiosk-cec.log`.

## Frontend architecture and UI

Keep the app clean and composable:

- `src/App.vue` owns the carousel sequence, per-slide durations, and slide-change state. It passes each widget’s configuration as props; widgets must not import the private kiosk configuration directly.
- `src/components/KioskCarousel.vue` owns only carousel timing and transitions. Individual widgets own their data loading, refresh timers, rendering, and error state.
- User-editable widget settings belong in the untracked `src/kiosk.config.ts`, copied from `src/kiosk.config.example.ts`. Existing configuration groups are `calendar`, `weather`, and `news`; private calendar URLs stay there. When adding a configurable widget, add a typed group to the example and local config, define a focused prop type in that widget, and pass it from `App.vue` into the carousel slot.
- Keep configuration declarative (locations, feeds, labels, feature options), not component behavior or markup. Put shared/default behavior in the component instead.

Before creating any UI primitive, inspect `src/components/ui/` and the installed `reka-ui` / shadcn-vue components. Use an existing component first. Compose new views from these primitives (for example `Card`, `CardHeader`, `CardContent`, and `Button`) plus Lucide icons rather than duplicating their accessibility, structure, or styling.

Use Tailwind utility classes for layout and visual styling. Keep CSS minimal; add a small scoped style block only when utility classes cannot express a genuine need (such as a named Vue transition). Do not add global component-specific CSS, duplicated design tokens, or one-off stylesheet abstractions for simple layouts. Design for the kiosk’s viewing distance: prioritize readable, large type and clear hierarchy.

### Kiosk typography calibration

The deployed kiosk display is currently `1920×1080` at about 60 Hz. Treat that as the primary design viewport and use the live `npm run pi:diagnose` display-mode output as the source of truth if the hardware changes. A laptop’s physical pixel density, browser zoom, window size, and viewing distance make it unsuitable for judging kiosk readability by eye.

The app scales its root `rem` from the 1920×1080 reference viewport at runtime. Therefore use Tailwind `rem` utilities for typography, spacing, and icon sizes; they scale together and preserve their proportion to the page. Avoid one-off `vw` text sizing unless an element has a demonstrated exception. Test layout at a 1920×1080 browser viewport (or capture the Pi with `npm run pi:screenshot`) before changing kiosk type. Do not add device-specific CSS or infer TV size from CSS pixels; CSS knows the viewport dimensions, while readable size still depends on viewing distance.

## Backend separation

Keep each external-data feature separated by responsibility: routes define endpoints, controllers translate HTTP requests/responses, services hold feature logic, and stores own remote fetching and caching. Keep secrets/private URLs out of tracked source and server output. Make external failures non-fatal and show a useful widget-level fallback instead of breaking the kiosk.
