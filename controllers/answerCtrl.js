const answerService = require("../services/answerService");
const db = require("../services/dbService");
const configFile = require("../config/config");
const path = require('path');
const fs = require("fs");
const util = require("util");
const unlinkAsync = util.promisify(fs.unlink);
const logger = require("../middlewares/logHandler.js");
const { log } = require("winston");


async function getAnswers(req, res, next) {
    try{
      console.log("getAnswes called");
      const solution_id = req.query.solution_id;
      const category_id = req.query.category_id;
      const subcategory_id = req.query.subcategory_id;
      const question_id=req.query.question_id;
        const answer = await answerService.getAnswers(solution_id, category_id,subcategory_id,question_id);
        if (answer != null)
          res.json(answer);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Record not found for the given input' });
    }catch(err){
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Questions NOT read properly' });
        next(err);
    }
}

async function mandatoryQuestions(req, res, next) {
  try{
    console.log("mandatoryQuestions called");
    const solution_id = req.query.solution_id;
    const category_id = req.query.category_id;
    const subcategory_id = req.query.subcategory_id;
    const question_id=req.query.question_id;
      const answer = await answerService.mandatoryQuestions(solution_id, category_id,subcategory_id,question_id);
      if (answer != null)
        res.json(answer);
      else
        res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Record not found for the given input' });
  }catch(err){
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Mandatory Questions NOT read properly' });
      next(err);
  }
}

/*async function getAllQuesAnsBySubcategory_id(req, res, next) {
  try{
      const answer = await answerService.getAllQuesAns(req.params.solution_id, req.params.category_id,req.params.subcategory_id);
      if (answer != null)
          res.json(answer);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Record not found for the given input' });
      
  }catch(err){
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Questions NOT read properly' });
      next(err);
  }
}*/


async function insertPossibleAnswer(req, res, next) {
    try{
      console.log("insertPossibleAnswer called");  
      const answer = await answerService.insertPossibleAnswer(req.body);
        if (answer != null)
          res.json(answer);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Please enter all records in proper format' });
    }catch(err){
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Possible Answer NOT inserted' });
        next(err);
    }
}


async function updatePossibleAnswer(req, res, next) {
    try {
      console.log("updatePossibleAnswer called");
      const possible_answer_id=req.params.possible_answer_id;
      const answer = await answerService.updatePossibleAnswer(possible_answer_id,req.body);
      res.json(answer);
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Possible Answer NOT updated' });
      next(err);
    }
}

async function insertUserAnswer(req, res, next) {
    try{
      console.log("insertUserAnswer called");
        const answer = await answerService.insertUserAnswer(req.body);
        if (answer != null)
          res.json(answer);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Please enter all records in proper format and unique question_id' });
    }catch(err){
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Answer NOT inserted' });
  
        next(err);
    }
}

  async function uploadFile(req, res, next) {
    try {
      console.log("uploadFile called");
      const folder_path = `${configFile.folderPath}`;
      //If folder FilesAndAttachments doesnt exist, then create it
      if (!fs.existsSync(folder_path)) {
        console.log("Creating folder FilesAndAttachments")
        fs.mkdirSync(folder_path);
      }
      let filename = await answerService.uploadFile(req, res);
      const file = JSON.stringify(filename)
      console.log(file)
      if (typeof(filename)!= 'object')
        res.status(500).json({ error: "Path not defined for attachments. There is some issue in Server. Please try after sometime" });
      else{
      console.log(filename + " Upload text");

      // Send the filename as JSON in the response
      res.json({ fileName: filename });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      // Handle the error and send an appropriate response
      res.status(500).json({ error: "An error occurred while uploading file" });
    }
  }

  async function uploadFileArchitecture(req, res, next) {
    try {
      console.log("uploadFileArchitecture called");
      const version_no = req.query.version_no;
      const folder_path = `${configFile.folderPath}`;
            //If folder FilesAndAttachments doesnt exist, then create it
            if (!fs.existsSync(folder_path)) {
              console.log("Creating folder FilesAndAttachments")
              fs.mkdirSync(folder_path);
            }
      let filename = await answerService.uploadFile(req, res);
      if (typeof(filename)!= 'object')
        res.status(500).json({ error: "Path not defined for attachments. There is some issue in Server. Please try after sometime" });
      else{
      console.log(filename + " Upload text");
      const file_new = JSON.stringify(filename);
      const files = JSON.parse(file_new);
      console.log("CONTROLLER", files);

      // Assuming files is an array of uploaded files
      for (const file of files) {
        console.log(file.path);
      
        const sourceFilePath = file.path;
        //If Architecture directory doestn exist then create a new one
        const arch_folderPath = path.join(folder_path,'Architecture');
        if (!fs.existsSync(arch_folderPath)) {
          console.log("Creating folder Architecture")
          fs.mkdirSync(arch_folderPath);
        }

        const destinationNewFolderPath = path.join(file.destination, 'Architecture', `version_${version_no}`);
        const destinationFilePath = path.join(destinationNewFolderPath, file.originalname);
      
        // Check if directory exists, if not, create a new directory
        if (!fs.existsSync(destinationNewFolderPath)) {
          fs.mkdirSync(destinationNewFolderPath);
        }
      
        // Use fs.copyFileSync to copy files synchronously
        fs.copyFileSync(sourceFilePath, destinationFilePath);
        console.log(`Copied file: ${file.originalname}`);
      
        // Delete file once it's copied to the destination
        try {
          // Use async/await to handle the promise returned by unlinkAsync
          await unlinkAsync(sourceFilePath);
          logger.info(`File deleted successfully: ${sourceFilePath}`);
          console.log("File deleted successfully");
        } catch (unlinkError) {
          logger.error(`Error deleting file: ${unlinkError.message}`);
          console.error(`Error deleting file: ${unlinkError.message}`);
        }
      }
      res.json({ fileName: filename });

    }
  } catch(error) {
    logger.error(`Error uploading file: ${error.message}`); 
    console.error(`Error uploading file: ${error.message}`); 
  }
}


// async function fetchFile(req,res, next) {
//   console.log("fetchFile called")
//   const filename = req.query.filename;
//   const mode = req.query.mode;
//   const version_no = req.query.version_no;
//   let basefolder;
// if (mode == "versioning")
// basefolder = `${configFile.versionFolderPath}\\version_${version_no}`;
// else if (mode == "cloud_architecture")
// basefolder = `${configFile.folderPath}\\Architecture\\version_${version_no}`;
// else
// basefolder = `${configFile.folderPath}`;
// const filePath = path.join(basefolder, filename);
// console.log("filePath = ", filePath)
// const fileResponse = await answerService.fetchFile(filePath, req, res);
// }


// async function fetchFile(req,res, next) {
//   try
//   {
// console.log("fetchFile called")
// logger.info("fetch controller called");
// const filename = req.query.filename;
// const mode = req.query.mode;
// const version_no = req.query.version_no;
// let basefolder;
// let filePath=""
// if (mode == "versioning")
// {
// basefolder = `${configFile.versionFolderPath}\\version_${version_no}`;
//  filePath = path.join(basefolder, filename);
// }
// else if (mode == "cloud_architecture")
// {
//   console.log("mode = cloud_architecture");
// //fetch file_location from architecture table and assigninto filePath variable
// //basefolder = `${configFile.folderPath}\\Architecture\\version_${version_no}`;
//   const archFileName = await db.query(`select architecture_name from architecture where version_no = ${version_no}`);
//   const supportFileName = await db.query(`select sd_name from supporting_documents where version_no = ${version_no}`);
//   console.log(supportFileName[0].sd_name);
//   console.log("archFileName = ", archFileName[0].architecture_name);
//   console.log(filename,'filename');
//   if(filename == archFileName[0].architecture_name)  {
//     console.log("inside arch");
//     const query = `select file_location from architecture where version_no = ${version_no}`;
//     console.log("archquery = ", query);
//     const rows = await db.query(query);
//     console.log(rows,'arch rows');
//     const file_location = rows[0].file_location;
//     filePath= file_location;
//     console.log("file_location = ", file_location);
//   }

//    if(filename == supportFileName[0].sd_name)
//   {
//     console.log("inside support");
//   const archFileName = await db.query(`select sd_name from supporting_documents where version_no = ${version_no}`);
//   console.log("suppot file name = ", archFileName[0].architecture_name);
//   const query = `select sd_location from supporting_documents where version_no = ${version_no}`;
//     console.log("subquery = ", query);
//   const rows = await db.query(query);
//   console.log(rows,'support rows');
//   const file_location = rows[0].sd_location;
//   filePath= file_location;
//   console.log("file_location = ", file_location); 
// }
// }
// else
// {
// basefolder = `${configFile.folderPath}`;
//  filePath = path.join(basefolder, filename);
// }


// console.log("filePath = ", filePath);
// logger.info(filePath);
// const fileResponse = await answerService.fetchFile(filePath, res);
// }
// catch (err) {
//      logger.warn("Error occurred while fetching file in controller: ", err);
//   console.error("Error occurred while fetching file controller : ", err);
//   res.status(500).send('Error in answer service: fetchfile method');
//   return "file error for fetch:";
// }
// }



async function fetchFile(req, res, next) {
  try {
    console.log("fetchFile called");
    logger.info("fetch controller called");

    const filename = req.query.filename;
    const mode = req.query.mode;
    const version_no = req.query.version_no;

    let basefolder;
    let filePath = "";

    if (mode === "versioning") {
      basefolder = path.join(configFile.versionFolderPath, `version_${version_no}`);
      filePath = path.join(basefolder, filename);
    } else if (mode === "cloud_architecture") {
      console.log("mode = cloud_architecture");

      // Fetch file_location from database based on mode
      const archFileName = await db.query(
        `SELECT architecture_name FROM architecture WHERE version_no = ?`,
        [version_no]
      );
      const supportFileName = await db.query(
        `SELECT sd_name FROM supporting_documents WHERE version_no = ?`,
        [version_no]
      );
      console.log(supportFileName);
      console.log('all files name', supportFileName.find(obj => obj.sd_name === filename)?.sd_name,archFileName[0].architecture_name, filename);


        const sdName=supportFileName.find(obj => obj.sd_name === filename)?.sd_name;

      // Fetch file_location from database based on mode
      if (filename === archFileName[0].architecture_name) {
        const query = `SELECT file_location FROM architecture WHERE version_no = ?`;
        const rows = await db.query(query, [version_no]);
        console.log("arch rows", rows);
        filePath = rows[0].file_location;
      } else if (filename == sdName) {
        const query = `SELECT sd_location FROM supporting_documents WHERE sd_name = ?`;
        const rows = await db.query(query, [sdName]);
        console.log("support rows", rows);
        filePath = rows[0].sd_location;
      }
    } else {  
      basefolder = configFile.folderPath;
      filePath = path.join(basefolder, filename);
    }

    console.log("filePath", filePath);
    logger.info("File path: " + filePath);

    const fileResponse = await answerService.fetchFile(filePath, res);
  } catch (err) {
    console.error("Error occurred while fetching file in controller: ", err);
    logger.error("Error occurred while fetching file in controller: ", err);
    res.status(500).send('Error in answer service: fetchfile method');
    // return "file error for fetch:"; // Returning this string may not be necessary
  }
}



async function filePreview(req,res,next) {
  try{
    console.log("filePreview called");
    const version_no = req.query.version_no;
    const answer = await answerService.filePreview(version_no,res);
    res.json(answer);
  } catch (err) {
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'File not retrieved for preview' });
    next(err);
  }
}


async function updateUserAnswer(req, res, next) {
    try {
      console.log("updateUSerAnswer called");
      const question_id= req.params.question_id;
      const answer = await answerService.updateUserAnswer(question_id,req.body);
      res.json(answer);
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Answer NOT updated' });
      next(err);
    }
  }



  async function updateAnswer(req, res, next) {
    try {
      const question_id = req.query.question_id
      const answer = await answerService.updateAnswer(question_id);
      res.json(answer);
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Answer NOT updated' });
      next(err);
    }
  }


  async function getCategoriesStatus(req, res, next) {
    try {
      console.log("getCategoriesStatus called");
      const answer = await answerService.getCategoriesStatus(req.query.solution_id,req.query.user_id);
      if(answer != null)
        res.json(answer);
      else
        res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Record not found for the given input' });
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Error in retrieving status' });
      next(err);
    } 
  }

  async function getSubCategoriesStatus(req, res, next) {
    try {

      console.log("getSubcategoriesStatus called");
      const answer = await answerService.getSubCategoriesStatus(req.query.solution_id, req.query.category_id);
      if (answer != null)
          res.json(answer);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Record not found for the given input' });
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Error in retrieving status' });
      next(err);
    } 
  }

  async function getSolutionsStatus(req, res, next) {
    try {
      console.log("getSolutionStatus called");
      const answer = await answerService.getSolutionsStatus(req.query.user_id);
      if (answer != null)
          res.json(answer);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Record not found for the given input' });
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Error in retrieving status' });
      next(err);
    } 
  }

  async function InsertVersioning(req, res, next) {
    try {
      console.log("InsertVersioninng called");
      if (req.body.solution_id === undefined) return res.status(500).json({ statusCode: 500, status: 'Pass the value for verrsoning', message: 'Version details NOT inserted as values are NULL' });
      const answer = await answerService.InsertVersioning(req);
      if (answer != null)
          res.json(answer);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Please enter all records in proper format' });
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Version details NOT inserted' });
      next(err);
    } 
  }

  async function getVersioningDetails(req, res, next) {
    try {
      console.log("getVersioningDetails called");
      const solution_id = req.query.solution_id;
      const version_no = req.query.version_no;
      const answer = await answerService.getVersioningDetails(solution_id, version_no);
      if (answer != null)
          res.json(answer);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Record not found for the given input' });
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Version details NOT retrieved' });
      next(err);
    } 
  }

  async function getVersionNumbers(req, res, next) {
    try {
      console.log("getVersionNumbers called");
      const solution_id = req.query.solution_id;
      const user_id = req.query.user_id;
      const answer = await answerService.getVersionNumbers(solution_id,user_id);
      if (answer != null)
          res.json(answer);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Record not found for the given input' });
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Error in retrieving versioning details' });
      next(err);
    } 
  }

  async function mandatoryStatus(req, res, next) {
    try {
      console.log("mandatoryStatus called");
      const solution_id = req.query.solution_id;
      const category_id = req.query.category_id;
      const answer = await answerService.mandatoryStatus(solution_id,category_id);
      if (answer != null)
          res.json(answer);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Record not found for the given input' });
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Error in retrieving mandatoryStatusAll details' });
      next(err);
    } 
  }

  async function mandatoryStatusAll(req, res, next) {
    try {
      console.log("mandatoryStatusAll called");
      const solution_id = req.query.solution_id;
      const answer = await answerService.mandatoryStatusAll(solution_id);
      if (answer != null)
          res.json(answer);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Record not found for the given input' });
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Error in retrieving mandatoryStatusAll details' });
      next(err);
    } 
  }

  async function mandatoryStatusSubCategory(req, res, next) {
    try {
      console.log("mandatoryStatusSubCategory called");
      const solution_id = req.query.solution_id;
      const answer = await answerService.mandatoryStatusSubCategory(solution_id);
      if (answer != null)
          res.json(answer);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Record not found for the given input' });
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Error in retrieving versioning details' });
      next(err);
    } 
  }

  async function insertArchitecture(req, res, next) {
    try {
      const answers = await answerService.insertArchitecture(req.body);
      if (answers != null)
          res.json(answers);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Please enter all records in proper format' });
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Architecture NOT inserted', error: err.message });
      next(err);
    }
  }

  async function getArchitecture(req, res, next) {
    try{
      console.log("getArchitecture called");
        const version_no = req.query.version_no;
        const answers = await answerService.getArchitecture(version_no);
        if (answers != null)
            res.json(answers);
          else
            res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Record not found for the given input' });
    }catch(err){
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Internal server error in retrieving questions', error: err.message});
      next(err);
    }
  }

  async function deleteArchitecture(req, res, next) {
    try {
      const version_no = req.params.id;
      const answers = await questionsService.deleteArchitecture(version_no);
      res.json(answers);
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Question NOT deleted', error: err.message});
      next(err);
    }
  }

  async function insertSupportingDocuments(req, res, next) {
    try {
      const answers = await answerService.insertSupportingDocuments(req.body);
      if (answers != null)
          res.json(answers);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Please enter all records in proper format' });
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Supporting Documents records NOT inserted', error: err.message });
      next(err);
    }
  }

  async function getSupportingDocuments(req, res, next) {
    try{
      console.log("getSupportingDocuments called");
        const version_no = req.query.version_no;
        const answers = await answerService.getSupportingDocuments(version_no);
        if (answers != null)
            res.json(answers);
          else
            res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Record not found for the given input' });
    }catch(err){
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Internal server error in retrieving questions', error: err.message});
      next(err);
    }
  }

  async function deleteSupportingDocuments(req, res, next) {
    try {
      const version_no = req.params.id;
      const answers = await questionsService.deleteSupportingDocuments(version_no);
      res.json(answers);
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Question NOT deleted', error: err.message});
      next(err);
    }
  }

  async function getArchitectureSDVersion(req, res, next) {
    try{
      console.log("getArchitectureSDVersion called");
        const version_no = req.query.version_no;
        const answers = await answerService.getArchitectureSDVersion(version_no,res);
        if (answers != null)
            res.json(answers);
          else
            res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Record not found for the given input' });
    }catch(err){
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Internal server error in retrieving questions', error: err.message});
      next(err);
    }
  }

  async function getVersionArchitecture(req,res,next) {
    try {
      console.log("getVersionArchitecture called");
      const answer = await answerService.getVersionArchitecture(req);
      if (answer != null)
          res.json(answer);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Record not found for the given input' });
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Error in retrieving version' });
      next(err);
    } 
  }

  async function getPreviousVersionMaster(req,res,next) {
    try {
      console.log("getPreviousVersionMaster called");
      const solution_id = req.query.solution_id;
      const answer = await answerService.getPreviousVersionMaster(solution_id);
          res.json(answer);
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Error in retrieving version' });
      next(err);
    } 
  }

module.exports = {
    getAnswers, 
    insertPossibleAnswer,fetchFile,uploadFile,
    updatePossibleAnswer,
    insertUserAnswer,
    updateUserAnswer,
    updateAnswer,
    getCategoriesStatus,
    getSubCategoriesStatus,
    InsertVersioning,
    getVersioningDetails,
    getVersionNumbers,
    getSolutionsStatus,
    mandatoryStatus,
    mandatoryStatusSubCategory,
    insertArchitecture,
    getArchitecture,
    deleteArchitecture,
    insertSupportingDocuments,
    getSupportingDocuments,
    deleteSupportingDocuments,
    getArchitectureSDVersion,
    getVersionArchitecture,
    uploadFileArchitecture,
    filePreview,
    mandatoryQuestions,
    getPreviousVersionMaster
}