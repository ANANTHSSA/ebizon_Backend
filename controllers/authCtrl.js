const db = require("../services/dbService");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require("../middlewares/logHandler.js");

require('dotenv').config();


async function handleLogin(req, res) {
  const emailID = req.body.email_id;
  const pwd = req.body.passwd;
console.log("Login request received");
  // To include single quotes to avoid syntax error in SQL query
  replacedEmailID = `'${emailID}'`;
  newHash = pwd;

  try {
      // Check if the given email_id is in our database
      const sql_email = 'SELECT email_id FROM users where is_delete=0 AND is_active=1';
      const rows_email = await db.query(sql_email);

      let emailFound = false;

      rows_email.forEach((row) => {
          if (row.email_id === emailID) {
              emailFound = true;
          }
      });

      if (emailFound) {
          const sql = 'SELECT * FROM users WHERE email_id = ' + replacedEmailID;
          const rows = await db.query(sql);

          // Retrieve the stored hash from the database
          const storedHash = rows[0].passwd; 

          //Retrieve is_active status
          const is_active = rows[0].is_active;

          if (rows[0].email_id === emailID && storedHash === newHash && is_active) {
          //Check if the user has already logged in
          const sql_login = 'SELECT * FROM session_management WHERE user_id = ' + rows[0].user_id + ' ORDER BY session_id DESC LIMIT 1';
          
          const rows_login = await db.query(sql_login);
            if(rows_login.length > 0) {
          if(rows_login[0].logout_time === null) {
             console.log("There's already a user logged in with this email_id")
            // res.status(409).json({ status: "Unauthorized", statusCode: 422, message: 'User already logged in with this email_id in another device/window', user_id: rows[0].user_id, role_id: rows[0].role_id, session_id: rows_login[0].session_id});
            // return;
            const sql_update_logout = 'UPDATE session_management SET logout_time = now() WHERE user_id = ? AND logout_time IS null';
            const rows_update_logout = await db.query(sql_update_logout,[rows[0].user_id]);
          } 
        }
          //Insert login time for the logined user
          const sql_login_insert = 'INSERT INTO session_management (user_id, login_time) VALUES(?,now())';
          const rows_login_insert = await db.query(sql_login_insert,[rows[0].user_id]);
          
                    //Retrieve session_id
                    const sql_session_id = 'SELECT * FROM session_management WHERE user_id = ' + rows[0].user_id + ' AND logout_time IS NULL';
                    const rows_session_id = await db.query(sql_session_id);
                    const session_id = rows_session_id[0].session_id;
                    
              // Create JWTs if login is successful
              const loginedUser = rows[0].user_id;
              const role_id = rows[0].role_id;

              const accessToken = jwt.sign({  "UserInfo": {
                                              "user_id": loginedUser,
                                              "role_id": role_id,
                                              "session_id": session_id}}, 
                                              process.env.ACCESS_TOKEN_SECRET, 
                                              { expiresIn: process.env.LOGIN_TOKEN_TIME } );
              const refreshToken = jwt.sign({ "UserInfo": {
                                              "user_id": loginedUser,
                                              "role_id": role_id,
                                              "session_id": session_id} }, 
                                               process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_TIME });

              // Store refresh token in the database
              const sql_insert = 'UPDATE users SET refreshtoken = ? WHERE user_id = ?';
              await db.query(sql_insert, [refreshToken, loginedUser]);

              // Store access token in a cookie
              res.cookie('jwt', refreshToken, { sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 });

              res.status(200).json({ accessToken, user_id: rows[0].user_id, email_id: rows[0].email_id, role_id: rows[0].role_id, company_name: rows[0].company_name,user_name: rows[0].user_name,session_id: rows_session_id[0].session_id, status: "Success" });
              
            } else {
              res.status(401).json({ status: "Unauthorized", statusCode: 401, message: 'Incorrect email or password' });
          }
      } else {
          console.log("Incorrect email / Deleted user/ Inactive user");
          res.status(401).json({ status: "Unauthorized", statusCode: 401, message: 'Incorrect email / Deleted user/ Inactive user' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'Failure', statusCode: 500, message: 'Internal Server Error' });
    }
}



async function handleRefreshToken(req, res) {
console.log("handleRefreshToken called");
  const cookies = req.cookies;
  //Check if there are cookies, if yes does it have jwt
  if(!cookies?.jwt) return res.sendStatus(401);
  
  const refreshToken = cookies.jwt;
  //To include double quotes to avoid syntax error in sql query
  const refreshToken_new = `'${refreshToken}'`;
  const sql = 'SELECT * FROM users WHERE refreshtoken = '+ refreshToken_new;
  const rows = await db.query(sql);
  const loginedUser = rows[0].user_id;
  if(!loginedUser) return res.sendStatus(401); //Unauthorized

  //verify jwt in refreshToken
  jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
          if(err || loginedUser !== decoded.UserInfo.user_id)  
          return res.sendStatus(408); //Request timeout since refresh token is expired

          //Create accesstoken since refreshtoken is verified
          const accessToken = jwt.sign(
            {"UserInfo": {
              "user_id": decoded.UserInfo.user_id,
              "role_id": decoded.UserInfo.role_id,
              "session_id": decoded.UserInfo.session_id}
            },
              process.env.ACCESS_TOKEN_SECRET,
              {expiresIn: process.env.NEW_TOKEN_TIME}
          );
          res.status(200).json({accessToken})
      }
  );

}


async function handleLogout(req, res) {
  //Also delete accesstoken on client machine
  console.log("logout called");
  const cookies = req.cookies;
  //Check if there are cookies, if yes does it have jwt
  if(!cookies?.jwt) return res.sendStatus(204); //No content, since there is no token

  const refreshToken = cookies.jwt;

  //To include double quotes to avoid syntax error in sql query
  const refreshToken_new = `'${refreshToken}'`;

  //Check if refreshtoken is in db
  const sql = 'SELECT * FROM users WHERE refreshtoken = '+ refreshToken_new;
  const rows = await db.query(sql);

  //If no token in db, then clear cookie
  if(rows.length == 0) {
    res.clearCookie('jwt', {httpOnly: true, sameSite: 'None', secure: true})
    return res.sendStatus(204); 
  } 
  const loginedUser = rows[0].user_id;

   //Delete refreshtoken in db
  const sql_delete = 'UPDATE users SET refreshtoken = null WHERE user_id = ?';
  await db.query(sql_delete,[loginedUser]);
  
  res.clearCookie('jwt', {httpOnly: true, sameSite: 'None', secure: true});
  res.status(200).json({ status_code: 200, status: 'Success', message: 'Logged out successfully' });
  const result = {};
  result.statusCode = 200;
  result.status = 'Success';
  result.message = 'Logged out successfully';
  return result;
}


async function getUser(req, res) {

    try {
      console.log("GET USER called");
    replacedEmailID = `'${req.params.emailID}'`
    console.log(replacedEmailID);
    const sql = 'SELECT created_on FROM users WHERE email_id = ' + replacedEmailID;
    const rows = await db.query(sql);
    if(rows.length == 0) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'User not registered' });
    } else
      res.json(rows);
    } catch (error) {
      console.error("Error getting user details:", error);
      throw new Error("An error occurred while getting user details");
    }
  
  }

  async function updateLogoutTime(req,res) {

    console.log("updateLogoutTime called")
    try {
   const user_id = req.params.user_id;
    const logout_time = req.body.logout_time;
    console.log("logout time", logout_time)
    //const session_id = req.body.session_id;
    if(user_id == null || user_id == undefined || logout_time == undefined || logout_time == null) {
   //   console.log("session_id in updatelogout", session_id)
      logger.warn("Please enter user_id and logout time")
      return res.status(500).json({ status: 'Failure', statusCode: 500, message: 'Please enter user_id and logout time' });
      
    }
    const sql_logout = 'UPDATE session_management SET logout_time = ? WHERE user_id = ? AND logout_time IS null';
 
    await db.query(sql_logout,[logout_time,user_id]);
    res.status(200).json({ status: "Success", statusCode: 200, message: 'Logout time added successfully' });

    logger.info("LOGOUT time added successfully")
    const result = {};
    result.statusCode = 200;
    result.status = 'Success';
    result.message = 'LOGOUT time added successfully';
  
    return result;

    } catch(err) {
      console.error(err.originalError); // Log the original error details
      throw new  Error(`An error occurred while adding logout time: ${err.message}`);
    }

  }


module.exports = {handleLogin,
                  handleRefreshToken,
                  handleLogout,
                  getUser,
                  updateLogoutTime};