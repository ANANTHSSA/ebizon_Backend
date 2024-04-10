
const express = require("express");
const auth_router = express.Router();

const authCtrl = require("../controllers/authCtrl");

auth_router.post("/login", authCtrl.handleLogin);
auth_router.get("/refresh", authCtrl.handleRefreshToken);
auth_router.patch("/logout", authCtrl.handleLogout);
auth_router.get("/users/:emailID", authCtrl.getUser);
//updating session_management table
auth_router.put("/users/logout/:user_id", authCtrl.updateLogoutTime);


module.exports = auth_router;

