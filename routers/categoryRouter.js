const express = require("express");
const catRouter = express.Router();
const catCtrl = require("../controllers/categoryCtrl");
const ROLES_LIST = require('../config/rolesList');
const verifyRoles = require('../middlewares/verifyRoles');

//Category table api
catRouter.post("/", verifyRoles(ROLES_LIST.ts_admin, ROLES_LIST.ebiz_admin), catCtrl.insertCategory);
//catRouter.post("/", catCtrl.insertCategory);
catRouter.put("/:category_id", verifyRoles(ROLES_LIST.ts_admin, ROLES_LIST.ebiz_admin), catCtrl.updateCategory);
//catRouter.put("/:category_id", catCtrl.updateCategory);
catRouter.get("/", catCtrl.getCategories);

//Category_answer_status api
catRouter.post("/catAnsStatus", verifyRoles(ROLES_LIST.ts_admin, ROLES_LIST.ebiz_admin), catCtrl.insertCatAnsStatus);
//catRouter.post("/catAnsStatus", catCtrl.insertCatAnsStatus);
catRouter.put("/catAnsStatus/:category_id", verifyRoles(ROLES_LIST.ts_admin, ROLES_LIST.ebiz_admin), catCtrl.updateCatAnsStatus);
//catRouter.put("/catAnsStatus/:category_id", catCtrl.updateCatAnsStatus);
catRouter.put("/lock/:category_id", verifyRoles(ROLES_LIST.ebiz_admin,  ROLES_LIST.cloud_architect), catCtrl.lockORUnlockCategory);
//catRouter.put("/lock/:category_id", catCtrl.lockORUnlockCategory);
catRouter.put("/lock/solution/:solution_id", verifyRoles(ROLES_LIST.ebiz_admin, ROLES_LIST.cloud_architect), catCtrl.bulklockORUnlockCategory);


//Sub Category api
catRouter.post("/subcategories", verifyRoles(ROLES_LIST.ts_admin, ROLES_LIST.ebiz_admin), catCtrl.insertSubcategory);
//catRouter.post("/subcategories", catCtrl.insertSubcategory);
catRouter.put("/subcategories/:subCategory_id", verifyRoles(ROLES_LIST.ts_admin, ROLES_LIST.ebiz_admin), catCtrl.updateSubcategory);
//catRouter.put("/subcategories/:subCategory_id", catCtrl.updateSubcategory);
catRouter.get("/subcategories", catCtrl.getSubcategories);



module.exports = catRouter;