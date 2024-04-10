

var mysqlObj = require('../config/config');
const mysql = require('mysql2'); 

async function query(sql, params) {
  const connection = mysql.createConnection(mysqlObj.db);
  connection.connect(); // Connect to the database

  return new Promise((resolve, reject) => {
    connection.query(sql, params, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  }).finally(() => {
    connection.end(); // Close the connection
  });
}

module.exports = {
  query
};