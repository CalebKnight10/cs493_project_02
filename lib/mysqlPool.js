// Promise wrapped version of mysql2 package
const mysql = require('mysql2/promise');

// Use values below to establish connection with DB & server
const mysqlHost = process.env.MYSQL_HOST || 'localhost';
const mysqlPort = process.env.MYSQL_PORT || '3306';
const mysqlDB = process.env.MYSQL_DB;
const mysqlUser = process.env.MYSQL_USER;
const mysqlPassword = process.env.MYSQL_PASSWORD;

// const mysqlHost = 'localhost';
// const mysqlPort = '3306';
// const mysqlDB = 'project_2';
// const mysqlUser = 'project_2';
// const mysqlPassword = 'kels';

// Pool of connections
const maxMySQLConnections = 10;
const mysqlPool = mysql.createPool({
    connectionLimit: maxMySQLConnections,
    host: mysqlHost,
    port: mysqlPort,
    database: mysqlDB,
    user: mysqlUser,
    password: mysqlPassword
});
module.exports = mysqlPool;


// async function test(param) {
//     console.log(param);
// }

// module.exports = test;
// test(mysqlPort);
// Use **mysqlPool.query()** for any queries to db
