module.exports = {
  client: 'pg',
  connection: process.env.DATABASE_URL || {
    user: process.env.USER,
    database: 't2-compiler'
  },
  pool: {
    min: 2,
    max: 10
  }
};
