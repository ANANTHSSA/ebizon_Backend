
const express = require("express");
const questionsRouter = express.Router();

const questCtrl = require("../controllers/questionsCtrl");
const ROLES_LIST = require('../config/rolesList');
const verifyRoles = require('../middlewares/verifyRoles');

//Example for giving role verification in api. If we dont give verifyRoles, then it means access to all
questionsRouter.post("/", verifyRoles(ROLES_LIST.ts_admin, ROLES_LIST.ebiz_admin),questCtrl.insertQuestion);
//questionsRouter.post("/", questCtrl.insertQuestion);
questionsRouter.put("/:question_id", verifyRoles(ROLES_LIST.ts_admin, ROLES_LIST.ebiz_admin), questCtrl.updateQuestion);
//questionsRouter.put("/:question_id", questCtrl.updateQuestion);
questionsRouter.get("/", questCtrl.getQuestions);
questionsRouter.get("/excel", questCtrl.getQuestionsExcel);
questionsRouter.delete("/:question_id", verifyRoles(ROLES_LIST.ts_admin, ROLES_LIST.ebiz_admin), questCtrl.deleteQuestion);
questionsRouter.delete("/excel/:question_id", verifyRoles(ROLES_LIST.ts_admin, ROLES_LIST.ebiz_admin), questCtrl.deleteQuestionExcel);

//questionsRouter.delete("/:question_id", questCtrl.deleteQuestion);

//APIS for bulk question insert, single question insert and single question edit
questionsRouter.post("/processExcel", verifyRoles(ROLES_LIST.ts_admin, ROLES_LIST.ebiz_admin), questCtrl.processExcel);
//questionsRouter.post("/processExcel", questCtrl.processExcel);
questionsRouter.post("/singleQuestionInsert", questCtrl.insertQuestionTemplate);
questionsRouter.post("/singleQuestionUpdate", questCtrl.updateQuestionTemplate);

module.exports = questionsRouter;