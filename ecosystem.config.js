module.exports = {
  apps: [
    {
      name: "api-server",
      script: "./dist/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "300M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "./logs/api-error.log",
      out_file: "./logs/api-out.log",
    },
    {
      name: "email-worker",
      script: "./dist/worker.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "150M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "./logs/worker-error.log",
      out_file: "./logs/worker-out.log",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
