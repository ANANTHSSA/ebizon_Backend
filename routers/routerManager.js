const verifyJWT = require('../middlewares/validateRequest');
const questionsRouter = require('./questionsRouter');
const userRouter = require('./userRouter');
const catRouter = require('./categoryRouter');
const solutionRouter = require('./solutionsRouter');
const answerRouter = require('./answerRouter');
const auth_route = require('./authRouter');

module.exports = function(app){  
  //Route for login, logout and refreshtoken
  app.use('/api', auth_route);

  //Route to verify JWT. Place the verifying route here globally, so that token verification is done on all the routes below it
  app.use(verifyJWT);
    
  app.use('/api/questions', questionsRouter);      
  app.use('/api/answers', answerRouter);      
  app.use('/api/users',  userRouter);      
  app.use('/api/solutions', solutionRouter);      
app.use('/api/categories', catRouter);      
}