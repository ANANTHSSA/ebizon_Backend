// This file is starting point of our application. Running this file, starts our server
const express = require('express');
const parser = require('body-parser');
const cors = require('cors'); 
const cookieParser = require('cookie-parser');
const credentials = require('./middlewares/credentials');
const corsOptions = require('./config/corsOptions');

const app= express();
const port = process.env.APP_PORT || 8080;

app.use(credentials);

// Cross Origin Resource Sharing
app.use(cors(corsOptions));

app.use(parser.urlencoded({extended: false}));
app.use(parser.json());

//middleware for cookies
app.use(cookieParser());

require('./routers/routerManager')(app); 

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack); // Log error stack trace to console (or your logger)
  res.status(500).send({ message: 'An unexpected error occurred' });
});

app.get ('/',(req,res) => {
res.send('This is your Express.js backend');
});
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
