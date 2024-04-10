
const express = require("express");
const solutionRouter = express.Router();
const solutionCtrl = require("../controllers/solutionCtrl");
const ROLES_LIST = require('../config/rolesList');
const verifyRoles = require('../middlewares/verifyRoles');

//solutions table api
solutionRouter.post("/", verifyRoles(ROLES_LIST.ts_admin, ROLES_LIST.ebiz_admin), solutionCtrl.insertSolution);
solutionRouter.post("/", solutionCtrl.insertSolution);
solutionRouter.patch("/", verifyRoles(ROLES_LIST.ts_admin, ROLES_LIST.ebiz_admin), solutionCtrl.updateSolution);
//solutionRouter.patch("/", solutionCtrl.updateSolution);
solutionRouter.get("/", solutionCtrl.getSolutions);    


//solution_answer_status api
solutionRouter.post("/status", verifyRoles(ROLES_LIST.cloud_architect), solutionCtrl.insertSolutionStatus);
//solutionRouter.post("/status", solutionCtrl.insertSolutionStatus);
solutionRouter.put("/status/:solution_id", verifyRoles(ROLES_LIST.cloud_architect), solutionCtrl.updateSolutionStatus);
//solutionRouter.put("/status/:solution_id", solutionCtrl.updateSolutionStatus);
solutionRouter.get("/status", solutionCtrl.getSolutionStatus);





module.exports = solutionRouter;