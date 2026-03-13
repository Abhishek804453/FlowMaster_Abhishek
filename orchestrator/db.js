const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'flowmaster',
    password: 'postgres',
    port: 5433,
});

module.exports = { pool };