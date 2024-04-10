const path = require('path');
require('dotenv').config({path: path.join(process.cwd(), '.env')});

const config = {
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER_NAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },folderPath: path.join(process.cwd(), 'FilesAndAttachments'),
  versionFolderPath: path.join(process.cwd(), 'FilesAndAttachments_versioning'),
};

module.exports = config;