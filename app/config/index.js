const fs = require('fs');
const env = process.env.NODE_ENV || 'development';

module.exports = {
  isProduction: env === 'production',
  isDevelopment: env === 'development',

  host: process.env.HOST || 'localhost',
  port: process.env.PORT || 8080,

  numCPUs: process.env.NUM_WORKERS || require('os').cpus().length,

  database: {
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    pass: process.env.PG_PASS,
    db: process.env.PG_DB,
  },

  session: {
    secret: fs.readFileSync('app/config/SESSION_SECRET', 'utf-8'),
  },

  logging: {
    level: 'debug',
    dbLevel: 'info',
  },
};