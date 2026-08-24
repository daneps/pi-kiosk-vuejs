const appDir = process.env.PI_APP_DIR || process.cwd()
const userId = process.getuid?.() ?? 1000

module.exports = {
  apps: [
    {
      name: 'pi-kiosk-api',
      script: 'server.js',
      cwd: appDir,
      env: { NODE_ENV: 'production', PORT: '3000' },
      autorestart: true,
      restart_delay: 5000,
    },
    {
      name: 'pi-kiosk-browser',
      script: 'scripts/pi-kiosk-browser.sh',
      cwd: appDir,
      interpreter: 'none',
      env: {
        XDG_RUNTIME_DIR: `/run/user/${userId}`,
        WAYLAND_DISPLAY: 'wayland-0',
        DBUS_SESSION_BUS_ADDRESS: 'unix:path=/run/user/1000/bus',
        XDG_SESSION_TYPE: 'wayland',
      },
      autorestart: true,
      restart_delay: 5000,
    },
  ],
}
