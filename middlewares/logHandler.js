const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, prettyPrint } = format;
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

//const logsDirectory = path.join(__dirname, '../logs');
const logsDirectory = path.join(process.cwd(), './logs');


const logFileName = 'app.log';

// Create the logs directory if it doesn't exist
// if (!fs.existsSync(logsDirectory)) {
//   fs.mkdirSync(logsDirectory);  
// }

const myCustomFormat = combine(
  timestamp({ format: 'YY-MM-DD HH:MM:SS' }),
  printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

const logger = createLogger({
  level: 'info',
  format: combine(myCustomFormat, prettyPrint()),
  transports: [
    new transports.Console({ format: combine(myCustomFormat) }),
    new DailyRotateFile({
      filename: path.join(logsDirectory, logFileName),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '2g',
      maxFiles: '30d',
      format: combine(
        timestamp({ format: 'YY-MM-DD HH:MM:SS' }),
        prettyPrint()
      ),
    }),
  ],
  debug: true,
});



module.exports = logger;






