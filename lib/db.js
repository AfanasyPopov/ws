const pgp = require('pg-promise')();
const cn = {
    host: 'localhost',
    port: 5432,
    database: 'smartdasdb',
    user: 'postgres',
    password: 'Loop'
};
const db = pgp(cn);
module.exports = db;