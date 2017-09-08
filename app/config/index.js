const fs = require('fs');
const env = process.env.NODE_ENV || 'development';

module.exports = {
  isProduction: env === 'production',
  isDevelopment: env === 'development',

  host: process.env.HOST || 'localhost',
  port: process.env.PORT || 8080,

  numCPUs: process.env.NUM_WORKERS || require('os').cpus().length,

  database: {
    mongo: `mongodb://${process.env.MONGO_HOST}/${process.env.MONGO_DB}`,
  },

  logging: {
    level: 'debug',
    dbLevel: 'info',
  }
}