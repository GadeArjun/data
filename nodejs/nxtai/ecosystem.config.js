module.exports = {
  apps: [
    {
      name: "nxtai-test",
      script: "server.js",        // your Node.js server file
      instances: 1,               // number of Node processes
      exec_mode: "fork",          // fork for testing; cluster for real scaling
      max_memory_restart: "400M",  // restart if RAM > 2 GB
      watch: true,                // optional: restart on file changes
      env: {
        NODE_ENV: "development",
        PORT: 5000
      }
    }
  ]
};