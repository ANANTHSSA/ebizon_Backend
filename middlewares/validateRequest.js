// module.exports = validateRequest;

// function validateRequest(req, next, schema) {
//     const options = {
//         abortEarly: false, // include all errors
//         allowUnknown: true, // ignore unknown props
//         stripUnknown: true // remove unknown props
//     };
//     const { error, value } = schema.validate(req.body, options);
//     if (error) {
//         next(`Validation error: ${error.details.map(x => x.message).join(', ')}`);
//     } else {
//         req.body = value;
//         next();
//     }
// }

const db = require("../services/dbService");
const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if(!authHeader?.startsWith('Bearer ')) return res.sendStatus(401);
    //Split the token
    const token = authHeader.split(' ')[1];

    // Decode the token to extract session_id
    const decodedToken = jwt.decode(token);
    // console.log("decoded token", decodedToken)

    if(decodedToken != null) {
    const session_id = decodedToken.UserInfo.session_id;
    //Check if this user has already logged out or not
    const sql_session = 'SELECT logout_time FROM session_management WHERE session_id = ' + session_id;
    const rows_session = await db.query(sql_session); 
    const sql_is_active = 'SELECT * FROM users WHERE user_id = ' + decodedToken.UserInfo.user_id;
    const rows_is_active = await db.query(sql_is_active);
    //If user is inactive or deleted then logout
    if(rows_is_active[0].is_active == false || rows_is_active[0].is_delete == true) {
        return res.sendStatus(408);
    }
    if(rows_session[0].logout_time !== null) {
        return res.sendStatus(406); //Logout since logout_time has already been added, meaning this credentials is being used in another windows/device
    }
}

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if(err) return res.sendStatus(403); //invalid token
            req.user_id = decoded.UserInfo.user_id;
            req.role_id = decoded.UserInfo.role_id;
            // console.log("decoded inside verify",decoded)
            next();
        }
    );
}


module.exports = verifyJWT