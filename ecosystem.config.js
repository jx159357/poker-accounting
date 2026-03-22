module.exports = {
  apps: [
    {
      name: 'poker-accounting',
      cwd: './backend',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '400M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '../logs/error.log',
      out_file: '../logs/output.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
