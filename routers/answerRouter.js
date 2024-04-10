const express = require("express");
const answerRouter = express.Router();
const answerCtrl = require("../controllers/answerCtrl");
const ROLES_LIST = require('../config/rolesList');
const verifyRoles = require('../middlewares/verifyRoles');

//api for pdf/HTML page
answerRouter.get("/", answerCtrl.getAnswers);
answerRouter.get("/mandatoryQuestions", answerCtrl.mandatoryQuestions);
answerRouter.get("/attachment", answerCtrl.fetchFile);
answerRouter.get("/preview", answerCtrl.filePreview);


//api for user_answers table
answerRouter.post("/", answerCtrl.insertUserAnswer);
answerRouter.post("/upload", answerCtrl.uploadFile);
answerRouter.put("/:question_id", answerCtrl.updateUserAnswer);

//demo-currently the below api is used for updating user_answer
//answerRouter.put("/:question_id", answerCtrl.updateAnswer);

//api for possible_answer table
answerRouter.post("/possibleAnswers", verifyRoles(ROLES_LIST.ts_admin, ROLES_LIST.ebiz_admin), answerCtrl.insertPossibleAnswer);
//answerRouter.post("/possibleAnswers", answerCtrl.insertPossibleAnswer);
answerRouter.put("/possibleAnswers/:possible_answer_id", verifyRoles(ROLES_LIST.ts_admin, ROLES_LIST.ebiz_admin), answerCtrl.updatePossibleAnswer);
//answerRouter.put("/possibleAnswers/:possible_answer_id", answerCtrl.updatePossibleAnswer);

//status
answerRouter.get("/categoriesStatus", answerCtrl.getCategoriesStatus);
answerRouter.get("/subCategoriesStatus", answerCtrl.getSubCategoriesStatus);
answerRouter.get("/solutionStatus", answerCtrl.getSolutionsStatus);
answerRouter.get("/mandatoryStatus", answerCtrl.mandatoryStatus);
//answerRouter.get("/mandatoryStatusAll", answerCtrl.mandatoryStatusAll);
answerRouter.get("/mandatoryStatusSubCategory", answerCtrl.mandatoryStatusSubCategory);




//versioning table
answerRouter.post("/versioning", verifyRoles(ROLES_LIST.ebiz_admin,ROLES_LIST.cloud_architect), answerCtrl.InsertVersioning);
//answerRouter.post("/versioning", answerCtrl.InsertVersioning);
answerRouter.get("/versioningDetails", answerCtrl.getVersioningDetails);
answerRouter.get("/versionList", answerCtrl.getVersionNumbers);
answerRouter.get("/previousVersion", answerCtrl.getPreviousVersionMaster);


//architecture and supporting documents table
answerRouter.post("/architecture", answerCtrl.insertArchitecture);
answerRouter.get("/architecture", answerCtrl.getArchitecture);
answerRouter.delete("/architecture/:version_no", answerCtrl.deleteArchitecture);
answerRouter.post("/architecture/upload", answerCtrl.uploadFileArchitecture);

answerRouter.post("/supportingdoc", answerCtrl.insertSupportingDocuments);
answerRouter.get("/supportingdoc", answerCtrl.getSupportingDocuments);
answerRouter.delete("/supportingdoc/:version_no", answerCtrl.deleteSupportingDocuments);

answerRouter.get("/architecture/supportingdoc", answerCtrl.getArchitectureSDVersion);
answerRouter.get("/architecture/version", answerCtrl.getVersionArchitecture);


module.exports = answerRouter