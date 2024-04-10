const express = require("express");
const userRouter = express.Router();
const userCtrl = require("../controllers/userCtrl");
const ROLES_LIST = require('../config/rolesList');
const verifyRoles = require('../middlewares/verifyRoles');

//users table
userRouter.post("/", verifyRoles(ROLES_LIST.ts_admin, ROLES_LIST.ebiz_admin,ROLES_LIST.cloud_architect), userCtrl.insertUser);
//userRouter.post("/", userCtrl.insertUser);
//userRouter.put("/:user_id", verifyRoles(ROLES_LIST.ts_admin, ROLES_LIST.ebiz_admin,ROLES_LIST.cloud_architect), userCtrl.updateUser);
userRouter.put("/:user_id", userCtrl.updateUser);
userRouter.delete("/:user_id", verifyRoles(ROLES_LIST.ts_admin, ROLES_LIST.ebiz_admin,ROLES_LIST.cloud_architect), userCtrl.deleteUser);
//userRouter.delete("/:user_id", userCtrl.deleteUser);
userRouter.patch("/:user_id", verifyRoles(ROLES_LIST.ts_admin, ROLES_LIST.ebiz_admin,ROLES_LIST.cloud_architect), userCtrl.deactivateUser);
//userRouter.patch("/:user_id", userCtrl.deactivateUser);
userRouter.get("/", userCtrl.getUsers);

//users solutions table
userRouter.put("/solutions/:user_id", verifyRoles(ROLES_LIST.ts_admin, ROLES_LIST.ebiz_admin,ROLES_LIST.cloud_architect), userCtrl.updateUserSolutionMapping);
//userRouter.put("/solutions/:user_id", userCtrl.updateUserSolutionMapping);
//api for either inserting/editing solution_id and role_id
userRouter.post("/solutions", verifyRoles(ROLES_LIST.ts_admin, ROLES_LIST.ebiz_admin,ROLES_LIST.cloud_architect), userCtrl.userAccess);
//userRouter.post("/solutions", userCtrl.userAccess);

//updating session_management table
//userRouter.put("/logout/:user_id", userCtrl.updateLogoutTime);




module.exports = userRouter;