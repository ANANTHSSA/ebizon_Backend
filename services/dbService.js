var mysqlObj = require('../config/config');
const mysql = require('mysql2'); 
const pool = mysql.createPool(mysqlObj.db);

async function query(sql, params) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

module.exports = {
  query
};