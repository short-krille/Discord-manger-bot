module.exports = {
  apps: [{
    name: 'manager',
    script: 'index.js',

    // Node.js Version
    node_args: '--max-old-space-size=512',

    // Umgebungsvariablen
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },

    // Logging
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    combine_logs: true,

    // PM2 Einstellungen
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',

    // Discord Bot spezifisch
    kill_timeout: 5000,
    listen_timeout: 3000,

    // Startverzögerung für Discord API
    min_uptime: '10s',
    max_restarts: 10
  }]
};