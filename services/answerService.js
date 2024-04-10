const db = require("./dbService");
const configFile = require("../config/config");
const multer = require("multer");
const fs = require("fs");
const util = require("util");
const path = require("path");
const unlinkAsync = util.promisify(fs.unlink);
const sourceFolderPath = configFile.folderPath;
const destinationFolderPath = configFile.versionFolderPath;
const logger = require("../middlewares/logHandler.js");


async function getAnswers(
  solution_id,
  category_id = null,
  subcategory_id = null,
  questionID = null
) {
  let sql;
  let conditions = " Where q.solution_id = " + solution_id;
  let params = [];

  if (category_id != null) {
    conditions += " AND q.cat_id = ? ";
    params = [category_id];
  }
  if (subcategory_id != null) {
    conditions += " AND q.sub_cat_id = ? ";
    params.push(subcategory_id);
  }
  if (questionID != null) {
    conditions += " AND q.question_id = ? ";
    params.push(questionID);
  }

  // sql =
  //   "SELECT " +
  //   "    @sno := CASE " +
  //   " WHEN @prev_sub_cat_id = sorted.sub_cat_id AND @prev_cat_id = sorted.cat_id AND @prev_sol_id = sorted.solution_id AND @prev_qid <> sorted.question_id THEN @sno + 1 " +
  //   " WHEN @prev_qid = sorted.question_id THEN @sno " +
  //   " ELSE 1 " +
  //   " END AS sno, " +
  //   "@prev_qid := sorted.question_id as question_id, " +
  //   "@prev_sub_cat_id := sorted.sub_cat_id as sub_cat_id, " +
  //   "@prev_cat_id := sorted.cat_id as cat_id, " +
  //   "@prev_sol_id := sorted.solution_id as solution_id, " +
  //   "sorted.sub_cat_name,  sorted.solution_name, sorted.cat_name,  " +
  //   "sorted.icon,  " +
  //   "sorted.image,  " +
  //   "sorted.file_attachment, " +
  //   "sorted.question,  " +
  //   "sorted.question_id,  " +
  //   "sorted.question_type,  " +
  //   "sorted.mandatory,  " +
  //   "sorted.user_ans_id, sorted.user_answers, " +
  //   "sorted.poss_answer, sorted.possible_answer_id " +
  //   "from (SELECT " +
  //   "q.question_id, " +
  //   "s.solution_id, " +
  //   "c.cat_id, " +
  //   "q.sub_cat_id, " +
  //   "sc.sub_cat_name,  s.solution_name, c.cat_name,  " +
  //   "sc.icon,  " +
  //   "sc.image,  " +
  //   "sc.file_attachment, " +
  //   "q.question,   " +
  //   "q.question_type,  " +
  //   " q.mandatory, " +
  //   " u.user_ans_id, u.user_answers, " +
  //   " pa.poss_answer, possible_answer_id " +
  //   "FROM solutions s  " +
  //   "JOIN questions q ON s.solution_id = q.solution_id  " +
  //   "JOIN sub_category sc ON q.sub_cat_id = sc.sub_cat_id  " +
  //   "JOIN categories c ON q.cat_id = c.cat_id " +
  //   "LEFT JOIN user_answers u ON q.question_id = u.question_id " +
  //   "LEFT join question_GroupAnsOption qg on  qg.question_id=q.question_id " +
  //   "LEFT JOIN possible_answers pa ON qg.group_id = pa.group_id   " +
  //   "LEFT JOIN solution_answer_status sa ON s.solution_id = sa.solution_id " +
  //   conditions +
  //   " ORDER BY s.solution_id, c.cat_id, sc.sub_cat_id, q.question_id) sorted, " +
  //   "(SELECT @sno := 0, @prev_qid := '', @prev_sub_cat_id := NULL, @prev_cat_id:=NULL, @prev_sol_id := NULL) tmp;";

 sql = "SELECT q.order_id as sno, " +
  "q.question_id, " +
  "s.solution_id, " +
  "c.cat_id, c.is_locked," +
  "q.sub_cat_id, " +
  "sc.sub_cat_name,  s.solution_name, c.cat_name,  " +
  "sc.icon,  " +
  "sc.image,  " +
  "sc.file_attachment, " +
  "q.question,   " +
  "q.question_type,  " +
  " q.mandatory, " +
  "q.follow_up, " +
  "q.order_id, " +
  " u.user_ans_id, u.user_answers, " +
  " pa.poss_answer, possible_answer_id " +
  "FROM solutions s  " +
  "JOIN questions q ON s.solution_id = q.solution_id  " +
  "JOIN sub_category sc ON q.sub_cat_id = sc.sub_cat_id  " +
  "JOIN categories c ON q.cat_id = c.cat_id " +
  "LEFT JOIN user_answers u ON q.question_id = u.question_id " +
  "LEFT join question_GroupAnsOption qg on  qg.question_id=q.question_id " +
  "LEFT JOIN possible_answers pa ON qg.group_id = pa.group_id   " +
  "LEFT JOIN solution_answer_status sa ON s.solution_id = sa.solution_id " +
  conditions +
  " ORDER BY s.solution_id, c.cat_id, sc.sub_cat_id, q.order_id, pa.possible_answer_id ";
  //Code review why we need this
  /*"JOIN users us ON sa.sol_stat_updated_by = us.user_id " +*/
  if(solution_id == null) {
    return null;
  }

  const rows = await db.query(sql, params);

  if (rows.length == 0) return null;
  // Create an object to store the final result
  const result = {
    solution: {
      solution_id: rows[0].solution_id,
      solution_name: rows[0].solution_name,
    },
    categorieslist: [],
    update: {
      sol_stat_updated_by: rows[0].user_name,
      sol_stat_updated_on: rows[0].sol_updated_on,
    },
  };

  // Create a helper function to find a category by ID
  function findCategory(categories, cat_id) {
    return categories.find(
      (categorylist) => categorylist.category.cat_id === cat_id
    );
  }

  // To ensure that questions are printed only once
  const questionMap = new Map();
  let subCategory;
  let category;
  rows.forEach((item) => {
    const {
      cat_id,is_locked,
      cat_name,
      sub_cat_id,
      sub_cat_name,
      icon,
      image,
      file_attachment,
      sno,
      question_id,
      question,
      question_type,
      mandatory,
      follow_up,
      order_id,
      user_ans_id,
      user_answers,
      poss_answer,
      possible_answer_id,
    } = item;

    category = findCategory(result.categorieslist, cat_id);

    if (!category) {
      // Create a new category
      const newCategory = {
        category: {
          cat_id,is_locked,
          cat_name, 
          sub_category_list: [],
        },
      };

      result.categorieslist.push(newCategory);
    }

    // Find the category again after adding it
    const updatedCategory = findCategory(result.categorieslist, cat_id);

    subCategory = updatedCategory.category.sub_category_list.find(
      (subCat) => subCat.sub_cat_id === sub_cat_id
    );

    if (!subCategory) {
      // Create a new sub-category
      updatedCategory.category.sub_category_list.push({
        sub_cat_id,is_locked,
        sub_cat_name,
        icon,
        image,
        file_attachment,
        qalist: [],
      });
    }

    // Find the sub-category again after adding it
    const updatedSubCategory = updatedCategory.category.sub_category_list.find(
      (subCat) => subCat.sub_cat_id === sub_cat_id
    );

    // Check if the question is already in the map
    if (!questionMap.has(question_id)) {
      // Create a new question object
      const questionObj = {
        sno,
        question_id,is_locked,
        question,
        question_type,
        mandatory,
        follow_up,
        order_id,
        user_answers: [],
        updated_by: item.updated_by,
        updated_on: item.updated_on,
        answerlist: null,
      };

      // Add a default user answer object
      questionObj.user_answers.push({
        ans_id: item.user_ans_id,
        answer: item.user_answers,
      });

      // Add the question to the map
      questionMap.set(question_id, questionObj);

      updatedSubCategory.qalist.push(questionObj);
    } else {
      // If the question is already in the map, update the user_answers array
      const updatedQuestion = questionMap.get(question_id);
      const ansIdExists = updatedQuestion.user_answers.some(
        (answer) => answer.ans_id === item.user_ans_id
      );

      if (!ansIdExists) {
        updatedQuestion.user_answers.push({
          ans_id: item.user_ans_id,
          answer: item.user_answers,
        });
      }
    }

    // Find possible answers for the question
    if (item.possible_answer_id !== null) {
      const updatedQuestion = questionMap.get(question_id);

      if (!updatedQuestion.answerlist) {
        updatedQuestion.answerlist = [];
      }
      updatedQuestion.answerlist.push({
        answer: item.poss_answer,
        possible_answer_id: item.possible_answer_id,
      });
    }
  });

  //Push into array
  const temp_array = [result];
  return temp_array;
}

async function mandatoryQuestions(
  solution_id,
  category_id = null,
  subcategory_id = null,
  questionID = null
) {
  let sql;
  let conditions = " Where q.solution_id = " + solution_id;
  let params = [];

  if (category_id != null) {
    conditions += " AND q.cat_id = ? ";
    params = [category_id];
  }
  if (subcategory_id != null) {
    conditions += " AND q.sub_cat_id = ? ";
    params.push(subcategory_id);
  }
  if (questionID != null) {
    conditions += " AND q.question_id = ? ";
    params.push(questionID);
  }
 
  sql = "SELECT q.order_id as sno, " +
  "q.question_id, " +
  "s.solution_id, " +
  "c.cat_id, c.is_locked," +
  "q.sub_cat_id, " +
  "sc.sub_cat_name,  s.solution_name, c.cat_name,  " +
  "sc.icon,  " +
  "sc.image,  " +
  "sc.file_attachment, " +
  "q.question,   " +
  "q.question_type,  " +
  " q.mandatory, " +
  "q.follow_up, " +
  "q.order_id, " +
  " u.user_ans_id, u.user_answers, " +
  " pa.poss_answer, possible_answer_id " +
  "FROM solutions s  " +
  "JOIN questions q ON s.solution_id = q.solution_id  " +
  "JOIN sub_category sc ON q.sub_cat_id = sc.sub_cat_id  " +
  "JOIN categories c ON q.cat_id = c.cat_id " +
  "LEFT JOIN user_answers u ON q.question_id = u.question_id " +
  "LEFT join question_GroupAnsOption qg on  qg.question_id=q.question_id " +
  "LEFT JOIN possible_answers pa ON qg.group_id = pa.group_id   " +
  "LEFT JOIN solution_answer_status sa ON s.solution_id = sa.solution_id " +
  conditions + " AND q.mandatory = 1  AND (u.user_answers IS NULL OR u.user_answers = '') "
  " ORDER BY s.solution_id, c.cat_id, sc.sub_cat_id, q.order_id ";

  if(solution_id == null) {
    return null;
  }
  const rows = await db.query(sql, params);

  if (rows.length == 0) return null;
  // Create an object to store the final result
  const result = {
    solution: {
      solution_id: rows[0].solution_id,
      solution_name: rows[0].solution_name,
    },
    categorieslist: [],
    update: {
      sol_stat_updated_by: rows[0].user_name,
      sol_stat_updated_on: rows[0].sol_updated_on,
    },
  };

  // Create a helper function to find a category by ID
  function findCategory(categories, cat_id) {
    return categories.find(
      (categorylist) => categorylist.category.cat_id === cat_id
    );
  }

  // To ensure that questions are printed only once
  const questionMap = new Map();
  let subCategory;
  let category;
  rows.forEach((item) => {
    const {
      cat_id,is_locked,
      cat_name,
      sub_cat_id,
      sub_cat_name,
      icon,
      image,
      file_attachment,
      sno,
      question_id,
      question,
      question_type,
      mandatory,
      follow_up,
      order_id,
      user_ans_id,
      user_answers,
      poss_answer,
      possible_answer_id,
    } = item;

    category = findCategory(result.categorieslist, cat_id);

    if (!category) {
      // Create a new category
      const newCategory = {
        category: {
          cat_id,is_locked,
          cat_name, 
          sub_category_list: [],
        },
      };

      result.categorieslist.push(newCategory);
    }

    // Find the category again after adding it
    const updatedCategory = findCategory(result.categorieslist, cat_id);

    subCategory = updatedCategory.category.sub_category_list.find(
      (subCat) => subCat.sub_cat_id === sub_cat_id
    );

    if (!subCategory) {
      // Create a new sub-category
      updatedCategory.category.sub_category_list.push({
        sub_cat_id,is_locked,
        sub_cat_name,
        icon,
        image,
        file_attachment,
        qalist: [],
      });
    }

    // Find the sub-category again after adding it
    const updatedSubCategory = updatedCategory.category.sub_category_list.find(
      (subCat) => subCat.sub_cat_id === sub_cat_id
    );

    // Check if the question is already in the map
    if (!questionMap.has(question_id)) {
      // Create a new question object
      const questionObj = {
        sno,
        question_id,is_locked,
        question,
        question_type,
        mandatory,
        follow_up,
        order_id,
        user_answers: [],
        updated_by: item.updated_by,
        updated_on: item.updated_on,
        answerlist: null,
      };

      // Add a default user answer object
      questionObj.user_answers.push({
        ans_id: item.user_ans_id,
        answer: item.user_answers,
      });

      // Add the question to the map
      questionMap.set(question_id, questionObj);

      updatedSubCategory.qalist.push(questionObj);
    } else {
      // If the question is already in the map, update the user_answers array
      const updatedQuestion = questionMap.get(question_id);
      const ansIdExists = updatedQuestion.user_answers.some(
        (answer) => answer.ans_id === item.user_ans_id
      );

      if (!ansIdExists) {
        updatedQuestion.user_answers.push({
          ans_id: item.user_ans_id,
          answer: item.user_answers,
        });
      }
    }

    // Find possible answers for the question
    if (item.possible_answer_id !== null) {
      const updatedQuestion = questionMap.get(question_id);

      if (!updatedQuestion.answerlist) {
        updatedQuestion.answerlist = [];
      }

      updatedQuestion.answerlist.push({
        answer: item.poss_answer,
        possible_answer_id: item.possible_answer_id,
      });
    }
  });

  //Push into array
  const temp_array = [result];
  return temp_array;
}

// async function fetchFile(filePath, res) {
//   console.log("fetchFile1 called")
//   // Define the path to the file.
//   // const filePath = path.join(__dirname, 'yourfile.ext'); // replace 'yourfile.ext' with your filename and extension

//   // Set the content type based on your file.
//   res.setHeader("Content-Type", "application/octet-stream");

//   // Send the file as a response.
//   res.sendFile(filePath, function (err) {
//     if (err) {
//       console.log("Error occurred while sending file: ", err);
//       res.status(err.status).end();
//     } else {
//       console.log("File sent successfully");
//     }
//   });
// }


// async function fetchFile(filePath, res) {
//   console.log("fetchFile service called");
//   logger.info("fetchfile service called");
// //filePath="\\ebzbackend\\FilesAndAttachments\\Architecture\\version_17\\test2.pdf";
// // filePath="/home/maduraiteam/ebzbackend/FilesAndAttachments/Architecture/version_17/test2.pdf"
 
//   // Set the CORS headers to allow requests from 'https://ebiz.dev25.in'
  // res.setHeader('Access-Control-Allow-Origin', 'https://ebiz.dev25.in');
 
//   try {
//     // Fetch the file stats
//     const fileStat = fs.statSync(filePath);
 
//     // Set the appropriate headers for the file response
//     res.writeHead(200, {
//       'Content-Type': 'application/pdf',
//       'Content-Length': fileStat.size
//     });
 
//     // Create a read stream and pipe the file content to the response
//     const readStream = fs.createReadStream(filePath);
//     readStream.pipe(res);
 
//   } catch (err) {
//     // Handle any errors that occur during file fetching
//     logger.warn("Error occurred while fetching file in service: ", err);
//     console.error("Error occurred while fetching file in service: ", err);
//     res.status(500).send('Error in answer service: fetchfile method');
//   }
// }


async function fetchFile(filePath, res) {
  console.log("fetchFile service called");
  logger.info("fetchfile service called");

  try {
    // Check if the file exists
    if (fs.existsSync(filePath)) {
      // Fetch the file stats
      const fileStat = fs.statSync(filePath);

      // Set the appropriate headers for the file response
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Length': fileStat.size
      });

      // Create a read stream and pipe the file content to the response
      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
    } else {
      console.log("File not found:", filePath);
      res.status(404).send("File not found");
    }
  } catch (err) {
    // Handle any errors that occur during file fetching
    logger.warn("Error occurred while fetching file in service:", err);
    console.error("Error occurred while fetching file in service:", err);
    res.status(500).send('Error in answer service: fetchfile method');
  }
}

async function insertPossibleAnswer(body) {
  const { question_id, poss_answer, created_by, created_on } = body;
  //Check if the input received is valid before processing them
  if (
    question_id == undefined ||
    poss_answer == undefined ||
    created_by == undefined ||
    created_on == undefined
  ) {
    logger.warn('Please enter all values - question_id, poss_answer, created_by, created_on and in their correct format')
    console.error(
      "Please enter all values - question_id, poss_answer, created_by, created_on and in their correct format"
    );
    return null;
  }
  const sql =
    "INSERT INTO possible_answers (question_id, poss_answer, created_by, created_on) VALUES (?,?,?,?);";

  try {
    await db.query(sql, [question_id, poss_answer, created_by, created_on]);
    logger.info(`Possible answer inserted successfully`);
    const result = {};
    result.statusCode = 200;
    result.status = "Success";
    result.message = "Possible answer inserted successfully";
    return result;
  } catch (err) {
    logger.error(`An error occurred while inserting possible answer: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new Error(
      `An error occurred while inserting possible answer: ${err.message}`
    );
  }
}

async function updatePossibleAnswer(possible_answer_id, body) {
  const { poss_answer, updated_by, updated_on, is_active } = body;

  const updateFields = [];
  const updateValues = [];

  if (poss_answer !== undefined) {
    updateFields.push("poss_answer = ?");
    updateValues.push(poss_answer);
  }

  if (is_active !== undefined) {
    updateFields.push("is_active = ?");
    updateValues.push(is_active);
  }

  //Push updated_by and updated_on fields
  updateFields.push("updated_by = ?, updated_on = ?");
  updateValues.push(updated_by, updated_on);

  if (updateFields.length === 0) {
    // No fields to update
    return { message: "Nothing to update" };
  }

  const sql = `UPDATE possible_answers SET ${updateFields.join(
    ", "
  )} WHERE possible_answer_id = ?`;
  const updateParams = [...updateValues, possible_answer_id];
  try {
    await db.query(sql, updateParams);
    // Fetch and return the updated data
    const [updatedRows] = await db.query(
      "SELECT * FROM possible_answers WHERE possible_answer_id = ?",
      [possible_answer_id]
    );
    const updatedData = updatedRows[0];
    logger.info(`Possible Answers updated successfully`);

    return {
      statusCode: 200,
      status: "Success",
      message: "Possible Answers updated successfully",
      data: updatedData,
    };
  } catch (err) {
    logger.error(`An error occurred while updating possible answers: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new Error(
      `An error occurred while updating possible answers: ${err.message}`
    );
  }
}

//////////////////////////////// FILE STORE ////////////////////////////

let filename;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, configFile.folderPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

async function uploadFile(req, res) {
  
  if (configFile.folderPath == undefined) {
    console.log(
      "FolderPath is not defined. Please specify in the config file as ,folderPath:C:\\Users\\FilesAndAttachments"
    );
    return "FolderPath is not defined. Please specify in the config file as ,folderPath:C:\\Users\\FilesAndAttachments";
  }
  return new Promise((resolve, reject) => {
    upload.array("file")(req, res, (err) => {
        if (err) {
            console.error("Error uploading data:", err);
            reject("An error occurred while uploading data");
            return;
        }
 
        // Assuming you have 'filename' available in your code, otherwise, replace it with the correct variable
        const filenames = req.files
 
        console.log("Files uploaded successfully!", filenames);
        resolve(filenames);
    });
  });
}

async function fetchFilee(filePath, req, res) {

  // Define the path to the file.
  // const filePath = path.join(__dirname, 'yourfile.ext'); // replace 'yourfile.ext' with your filename and extension

  // Set the content type based on your file.
  res.setHeader("Content-Type", "application/octet-stream");

  // Send the file as a response.
  res.sendFile(filePath, function (err) {
    if (err) {
      console.log("Error occurred while sending file: ", err);
      res.status(err.status).end();
    } else {
      console.log("File sent successfully");
    }
  });
}

async function deleteFile(fileName) {
  console.log(fileName, "filename");
  // Code for removing the physical file from the folder path
  let fullFilePath = path.join(configFile.folderPath, fileName);
  console.log(fullFilePath, "fullFilePath");

  try {
    // Use async/await to handle the promise returned by unlinkAsync
    await unlinkAsync(fullFilePath);
    logger.info(`File deleted successfully:${fullFilePath}`);
    console.log("File deleted successfully");
    return "File deleted successfully";
  } catch (err) {
    logger.warn(`file not available for delete:${fullFilePath}`);
    console.log("file not available for delete:");
    return "file not available for delete:";
  }
}

async function filePreview (body,res) {
  const version_no = body;

  const file_path_find = await db.query('SELECT file_location FROM architecture WHERE version_no = ?',[version_no]);

  const file_path = file_path_find[0].file_location;
  const fileContent = fs.readFileSync(file_path);

  res.setHeader('Content-Type', 'application/pdf');
  res.send(fileContent);

}
/////////////////  usermodel block  //////////////////////

async function insertUserAnswer(body) {
  //WRITE CODE FOR UPLOADING FILE
  //1. CHECK WHETHER QUESTION_TYPE is File, then call the upload function with necessary parameters
  /*upload.single('file'), (req, res) => {
    res.json({ message: 'File uploaded successfully!' });
  };*/
  //upload.single(JSON.parse(body.file))

  const { question_id, user_answers, Remarks, created_by, created_on } = body;
  //Check if the input received is valid before processing them
  if (
    question_id == "" ||
    question_id == undefined ||
    user_answers == undefined ||
    user_answers == "" ||
    created_by == undefined ||
    created_on == undefined
  ) {
    logger.warn('Please enter all values - question_id, user_answers, Remarks, created_by, created_on and in their correct format')
    console.error(
      "Please enter all values - question_id, user_answers, Remarks, created_by, created_on and in their correct format"
    );
    return null;
  }

  //Check CA locked or unlocked categories for answering
try { 
  let sql ="select q.solution_id, q.cat_id, q.question_id, c.is_locked from questions q  " +
  " left join categories c on c.cat_id=q.cat_id and c.solution_id = q.solution_id " +
  " where q.question_id= " + question_id
    let rows = await db.query(sql);

    // if(rows.length == 0) {
    //   logger.warn("No records found for the given input");
    //   const result = {};
    //   result.statusCode = 500;
    //   result.status = 'Failure';
    //   result.message = 'No records found for the given input';
    
    // return result;
    // }
  let is_locked = rows[0].is_locked
  if (is_locked=='1')
  {
    const result = {};
    result.statusCode = 500;
    result.status = "Failed";
    result.message = "Answer not inserted As It is locked";
    return result;
  }

  //Check if user_answer has already been added for the question_id
  const sql_check = 'SELECT * FROM user_answers WHERE question_id = ' + question_id;
  const rows_check = await db.query(sql_check);
  if(rows_check.length !== 0) {
    logger.info(`Answer is already captured for this question_id ${question_id}`);
    const result = {};
    result.statusCode = 200;
    result.status = "Success";
    result.message = "Answer is already captured";
    return result;
  }

  sql ="INSERT INTO user_answers (question_id, user_answers, Remarks, created_by, created_on) VALUES (?,?,?,?,?);";

 
    await db.query(sql, [
      question_id,
      user_answers,
      Remarks,
      created_by,
      created_on,
    ]);
    logger.info(`User Answer inserted successfully`);
    const result = {};
    result.statusCode = 200;
    result.status = "Success";
    result.message = "Answer inserted successfully";
    return result;
  } catch (err) {
    logger.error(`An error occurred while inserting user answer: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new Error(
      `An error occurred while inserting user answer: ${err.message}`
    );
  }
}

async function updateUserAnswer(question_id, body) {
   //Check CA locked or unlocked categories for answering
try { 
  const sql ="select q.solution_id, q.cat_id, q.question_id, c.is_locked from questions q  " +
  " left join categories c on c.cat_id=q.cat_id and c.solution_id = q.solution_id " +
  " where q.question_id= " + question_id
    let rows = await db.query(sql);

    // if(rows.length == 0) {
    //   logger.warn("No records found for the given input");
    //   const result = {};
    //   result.statusCode = 500;
    //   result.status = 'Failure';
    //   result.message = 'No records found for the given input';
    
    // return result;
    // }
    let is_locked = rows[0].is_locked
  if (is_locked==true)
  {
    const result = {};
    result.statusCode = 500;
    result.status = "Failed";
    result.message = "Answer not inserted As It is locked";
    return result;
  }

  const { Remarks, updated_by, updated_on, is_active } = body;
  user_answers = body.user_answers;
  
  const updateFields = [];
  const updateValues = [];

  // if (user_answers !== undefined) {
  //   //Check if user_answer sent is the same or different for the given question_id
  //   const sql_ans = 'SELECT * FROM user_answers WHERE question_id = ' + question_id;
  //   const rows_ans = await db.query(sql_ans);
  //   console.log("question_id = ", question_id)
  //   console.log("Sent user_answers = ", user_answers)
  //   console.log("TABLE user_answers = ", rows_ans[0].user_answers)
  //   if(rows_ans[0].user_answers !== user_answers) {
  //   user_answers = JSON.stringify(user_answers);
  //   updateFields.push("user_answers = ?");
  //   updateValues.push(user_answers);
  //   } else {
  //     logger.info(`Answer has already been updated for this question_id ${question_id}`);
  //   }
  // }
  if(user_answers !== undefined) {
    user_answers = JSON.stringify(user_answers);
    updateFields.push("user_answers = ?");
    updateValues.push(user_answers);
  }

  if (Remarks !== undefined) {
    updateFields.push("Remarks = ?");
    updateValues.push(Remarks);
  }

  if (is_active !== undefined) {
    updateFields.push("is_active = ?");
    updateValues.push(is_active);
  }

  //Push updated_by and updated_on fields
  updateFields.push("updated_by = ?, updated_on = ?");
  updateValues.push(updated_by, updated_on);

  if (updateFields.length === 0) {
    // No fields to update
    return { message: "Nothing to update" };
  }

  // SELECT question_type FROM questions WHERE question_id = question_id;
  // if question_type == file then collect already stored file name from user_answers table
  // SELECT user_answers FROM user_answers WHERE question_id = question_id;
  //Parse this user_answers object and get the file name from the answers attribute
  //call deleteFile function with the fil name fetched from previous statement

  const questionTypeResult = await db.query(
    "SELECT question_type FROM questions WHERE question_id = ?",
    [question_id]
  );

  // if(questionTypeResult.length == 0) {
  //   logger.warn("No records found for the given input");
  //   const result = {};
  //   result.statusCode = 500;
  //   result.status = 'Failure';
  //   result.message = 'No records found for the given input';
  
  // return result;
  // }
  const questionType = questionTypeResult[0].question_type;

  if (questionType === "file") {
    // Fetch user_answers from the user_answers table
    const userAnswersResult = await db.query(
      "SELECT user_answers FROM user_answers WHERE question_id = ?",
      [question_id]
    );
    // if(userAnswersResult.length == 0) {
    //   logger.warn("No records found for the given input");
    //   const result = {};
    //   result.statusCode = 500;
    //   result.status = 'Failure';
    //   result.message = 'No records found for the given input';
    
    // return result;
    // }

    const userAnswers = userAnswersResult[0].user_answers;

    // Parse user_answers object to get the file name
    const parsedAnswers = userAnswers[0]?.answers;
    console.log(parsedAnswers, "parsedAnswers");
    const fileName = parsedAnswers; // Assuming the file name is stored in the 'answers' attribute

    // Call deleteFile function with the fetched file name
    await deleteFile(fileName);
  }

  const sql_update = `UPDATE user_answers SET ${updateFields.join(
    ", "
  )} WHERE question_id = ?`;
  const updateParams = [...updateValues, question_id];
  //console.log("sql = ", sql_update);
  //console.log("question_id = ", question_id);
  //console.log("user_answer = ", user_answers);
  await db.query(sql_update, updateParams);

  // const to_value = user_answers;
  // await insertAuditTable(
  //   question_id,
  //   to_value,
  //   updated_by,
  //   updated_on,
  //   is_active
  // );

    // Fetch and return the updated data
    const [updatedRows] = await db.query(
      "SELECT * FROM user_answers WHERE question_id = ?",
      [question_id]
    );
    const updatedData = updatedRows[0];
    logger.info(`User Answer updated successfully`);

    return {
      statusCode: 200,
      status: "Success",
      message: "User Answer updated successfully",
      data: updatedData,
    };
  } catch (err) {
    logger.error(`An error occurred while updating user answer: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new Error(
      `An error occurred while updating user answer: ${err.message}`
    );
  }
}

async function updateAnswer(question_id) {
  const user_answers = body;
  const sql = "UPDATE user_answers SET user_answers = ? WHERE question_id = ?";

  try {
    const result = await db.query(sql, [user_answers, question_id]);

    sql_fields =
      "SELECT * FROM user_answers WHERE question_id = " + question_id;
    const fields = await db.query(sql_fields);

    //Attaching status info
    fields[0].question_id = question_id;
    fields[0].statuscode = 200;
    fields[0].status = "Success";
    fields[0].message = "User Answer updated successfully";

    return fields;
  } catch (err) {
    logger.error(`An error occurred while updating user answer: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new Error(
      `An error occurred while updating user answer: ${err.message}`
    );
  }
}

async function insertAuditTable(
  qid,
  to_value,
  created_by,
  created_on,
  is_active
) {
  //Below two lines of code to collect previous answer
  try{
  const sql =
    "SELECT q.solution_id, q.question_id, q.cat_id, u.user_answers FROM questions q JOIN user_answers u ON q.question_id = u.question_id WHERE q.question_id =" +
    qid;
  const rows = await db.query(sql);
  const audit_sql =
    "INSERT INTO audit (solution_id, question_id, cat_id, from_value, to_value, created_by, created_on, is_active) VALUES(?,?,?,?,?,?,?,?)";
  await db.query(audit_sql, [
    rows[0].solution_id,
    qid,
    rows[0].cat_id,
    rows[0].user_answers,
    to_value,
    created_by,
    created_on,
    is_active,
  ]);
} catch(err) {
  logger.error(`An error occurred while inserting audit details: ${err.message}`);
  console.error(err.originalError); // Log the original error details
  throw new  Error(`An error occurred while inserting audit details: ${err.message}`);
}
}

// async function getCategoriesStatus(solution_id, user_id) {
//   try {
//     //Verify if this user has purchased this solution. While clicking on solutions in dashboard, this api is being called
//     const sql = 'SELECT solution_id FROM user_solutions WHERE user_id = ' + user_id;
//     const solutions = await db.query(sql);
//     // if(solutions.length == 0) {
//     //   console.log("line 958")
//     //   logger.warn("No records found for the given input");
//     //   const result = {};
//     //   result.statusCode = 500;
//     //   result.status = 'Failure';
//     //   result.message = 'No records found for the given input';
    
//     // return result;
//     // }
//     const solution_check = solutions.some(obj => obj.solution_id == solution_id);
//     if(!solution_check) {
//       logger.warn("Solution not purchased by the customer")
//       return {
//         statusCode: 401,
//         status: "Failure",
//         message: "You do not have access to this solution",
//       };
//     }

//     //Find number of questions in each category
//     const sql_q =
//       "SELECT s.solution_id, s.solution_name, c.cat_id, c.cat_name, c.is_locked, q.question_id, q.mandatory, q.order_id FROM questions q JOIN categories c ON q.cat_id = c.cat_id JOIN solutions s ON s.solution_id = q.solution_id WHERE q.solution_id = " +
//       solution_id ;
//     const rows_q = await db.query(sql_q);
//     // if(rows_q.length == 0) {
//     //   console.log("line 982")
//     //   logger.warn("No records found for the given input");
//     //   const result = {};
//     //   result.statusCode = 500;
//     //   result.status = 'Failure';
//     //   result.message = 'No records found for the given input';
    
//     // return result;
//     // }
//     logger.info(`Number of questions found successfully in getCategoriesStatus function`);

//     temp = [
//       {
//         solution_id: rows_q[0].solution_id,
//         solution_name: rows_q[0].solution_name,
//         cat_id: rows_q[0].cat_id,
//         cat_name: rows_q[0].cat_name,
//         lock: rows_q[0].is_locked,
//         question_count: null,
//         mandatory_count: null,
//         answer_count: null,
//       },
//     ];
//     rows_q.forEach((item) => {
//       const count = temp.some((temp_item) => temp_item.cat_id === item.cat_id);
//       if (!count)
//         temp.push({
//           solution_id: item.solution_id,
//           solution_name: item.solution_name,
//           cat_id: item.cat_id,
//           cat_name: item.cat_name,
//           lock: item.is_locked,
//           question_count: null,
//           mandatory_count: null,
//           answer_count: null,
//         });
//     });

//     temp.forEach((temp_item) => {
//       let counter = 0;
//       let mandatory_counter = 0;
//       rows_q.forEach((item) => {
//         if (temp_item.cat_id == item.cat_id && item.order_id != 0) {
//           counter++;
//           if (item.mandatory == true) {
//             mandatory_counter++;
//           }
//         }
//         temp_item.question_count = counter;
//         temp_item.mandatory_count = mandatory_counter;
//       });
//     });

//     //Find number of questions ANSWERED in each category
//     const sql_a =
//       "SELECT q.cat_id, a.user_answers FROM user_answers a JOIN questions q ON q.question_id = a.question_id WHERE q.solution_id = " +
//       solution_id;
//     const rows_a = await db.query(sql_a);
//     // if(rows_a.length == 0) {
//     //   logger.warn("No records found for the given input");
//     //   const result = {};
//     //   result.statusCode = 500;
//     //   result.status = 'Failure';
//     //   result.message = 'No records found for the given input';
    
//     // return result;
//     // }
//     logger.info(`Number of questions answered found successfully in getCategoriesStatus function`);

//     temp.forEach((temp_item) => {
//       counter = 0;
//       rows_a.forEach((item) => {
//         if (temp_item.cat_id === item.cat_id &&
//           item.user_answers !== null && item.user_answers != "" && item.user_answers != [] ) counter++;
//       });
//       temp_item.answer_count = counter;
//     });

//     return temp;
//   } catch (err) {
//     logger.error(`An error occurred while retrieving category status: ${err.message}`);
//     console.error(err.originalError); // Log the original error details
//     throw new Error(
//       `An error occurred while retrieving category status: ${err.message}`
//     );
//   }
// }

async function getCategoriesStatus(solution_id, user_id) {
  try {
    //Verify if this user has purchased this solution. While clicking on solutions in dashboard, this api is being called
    const sql = 'SELECT solution_id FROM user_solutions WHERE user_id = ' + user_id;
    const solutions = await db.query(sql);
    // if(solutions.length == 0) {
    //   console.log("line 958")
    //   logger.warn("No records found for the given input");
    //   const result = {};
    //   result.statusCode = 500;
    //   result.status = 'Failure';
    //   result.message = 'No records found for the given input';
    
    // return result;
    // }
    const solution_check = solutions.some(obj => obj.solution_id == solution_id);
    if(!solution_check) {
      logger.warn("Solution not purchased by the customer")
      return {
        statusCode: 401,
        status: "Failure",
        message: "You do not have access to this solution",
      };
    }

    const sql_status = "SELECT so.solution_id, so.solution_name, c.cat_id, c.cat_name, c.is_locked AS locked, COUNT(q.mandatory) AS mandatory_count, COUNT(q.question) AS question_count, CAST(COALESCE(SUM(CASE WHEN a.user_ans_id IS NOT NULL AND a.user_answers != '' AND JSON_LENGTH(a.user_answers) != 0 AND a.user_answers IS NOT NULL THEN 1 ELSE 0 END), 0) AS SIGNED) AS answer_count FROM questions q JOIN categories c ON q.cat_id = c.cat_id JOIN solutions so ON so.solution_id = q.solution_id LEFT JOIN user_answers a ON q.question_id = a.question_id WHERE q.solution_id = " + solution_id +
    " AND q.order_id != 0 GROUP BY q.cat_id;"

    const temp = await db.query(sql_status)

    // if(rows_q.length == 0) {
    //   console.log("line 982")
    //   logger.warn("No records found for the given input");
    //   const result = {};
    //   result.statusCode = 500;
    //   result.status = 'Failure';
    //   result.message = 'No records found for the given input';
    
    // return result;
    // }

    return temp;
  } catch (err) {
    logger.error(`An error occurred while retrieving category status: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new Error(
      `An error occurred while retrieving category status: ${err.message}`
    );
  }
}

async function getSubCategoriesStatus_bck(solution_id, category_id) {
  try {
    //Find number of questions in each category
    const sql_q =
      "SELECT c.cat_id, c.cat_name, q.sub_cat_id, s.sub_cat_name, q.question_id, q.mandatory FROM questions q " +
      "JOIN categories c ON q.cat_id = c.cat_id " +
      "JOIN sub_category s ON s.sub_cat_id = q.sub_cat_id WHERE q.solution_id = " +
      solution_id +
      " AND q.cat_id = " +
      category_id;
    const rows_q = await db.query(sql_q);

    temp = [
      {
        cat_id: rows_q[0].cat_id,
        cat_name: rows_q[0].cat_name,
        subCategory_id: rows_q[0].sub_cat_id,
        sub_cat_name: rows_q[0].sub_cat_name,
        question_count: null,
        mandatory_count: null,
        answer_count: null,
      },
    ];
    rows_q.forEach((item) => {
      const count = temp.some(
        (temp_item) => temp_item.sub_cat_id === item.sub_cat_id
      );
      if (!count)
        temp.push({
          cat_id: item.cat_id,
          cat_name: item.cat_name,
          sub_cat_id: item.sub_cat_id,
          sub_cat_name: item.sub_cat_name,
          question_count: null,
          mandatory_count: null,
          answer_count: null,
        });
    });

    temp.forEach((temp_item) => {
      let counter = 0;
      let mandatory_counter = 0;
      rows_q.forEach((item) => {
        if (temp_item.sub_cat_id == item.sub_cat_id) {
          counter++;
          if (item.mandatory == true) {
            mandatory_counter++;
          }
        }
        temp_item.question_count = counter;
        temp_item.mandatory_count = mandatory_counter;
      });
    });

    //Find number of questions ANSWERED in each category
    const sql_a =
      "SELECT q.sub_cat_id, a.user_answers FROM user_answers a JOIN questions q ON q.question_id = a.question_id WHERE q.solution_id = " +
      solution_id +
      " AND q.cat_id = " +
      category_id;
    const rows_a = await db.query(sql_a);

    temp.forEach((temp_item) => {
      counter = 0;
      rows_a.forEach((item) => {
        if (temp_item.sub_cat_id === item.sub_cat_id) counter++;
      });
      temp_item.answer_count = counter;
    });

    return temp;
  } catch (err) {
    logger.error(`An error occurred while retrieving sub category status: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new Error(
      `An error occurred while retrieving sub category status: ${err.message}`
    );
  }
}

async function getSubCategoriesStatus(solution_id, category_id) {
  try {
    //Find number of questions in each category
    // const sql =
    //   "SELECT c.cat_id, c.cat_name, q.sub_cat_id, s.order_id AS sub_cat_order_id, s.sub_cat_name,count( q.mandatory) mandatory_count, count(q.question) question_count , count(a.user_ans_id) answers_count FROM questions q " +
    //   "JOIN categories c ON q.cat_id = c.cat_id JOIN sub_category s ON s.sub_cat_id = q.sub_cat_id  " +
    //   " left join user_answers a ON q.question_id = a.question_id  " +
    //   " WHERE q.solution_id = " +
    //   solution_id +
    //   " AND q.cat_id = " +
    //   category_id +
    //   " GROUP BY  q.cat_id, q.sub_cat_id ";
    const sql =
  "SELECT so.solution_id, so.solution_name, c.cat_id, c.cat_name, q.sub_cat_id, s.order_id AS sub_cat_order_id, s.sub_cat_name, " +
  "COUNT(q.mandatory) AS mandatory_count, " +
  "COUNT(q.question) AS question_count, " +
  "CAST(COALESCE(SUM(CASE WHEN a.user_ans_id IS NOT NULL AND a.user_answers != '' AND JSON_LENGTH(a.user_answers) != 0 AND a.user_answers IS NOT NULL THEN 1 ELSE 0 END), 0) AS SIGNED) AS answers_count " +
  "FROM questions q " +
  "JOIN categories c ON q.cat_id = c.cat_id " +
  "JOIN sub_category s ON s.sub_cat_id = q.sub_cat_id " +
  "JOIN solutions so ON so.solution_id = q.solution_id " +
  "LEFT JOIN user_answers a ON q.question_id = a.question_id " +
  "WHERE q.solution_id = " + solution_id +
  " AND q.cat_id = " + category_id +
  " AND q.order_id != 0 " + 
  "GROUP BY q.cat_id, q.sub_cat_id";

    const rows = await db.query(sql);
    logger.info(`Sub category status retrieved successfully`);
    return rows;
  } catch (err) {
    logger.error(`An error occurred while retrieving sub category status: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new Error(
      `An error occurred while retrieving sub category status: ${err.message}`
    );
  }
}

//Api for dashboard to display bargraph for solutions purchased by each user
// async function getSolutionsStatus(user_id) {
//   try {
//     //Find the solutions that are mapped to the given user_id
//     const sql_sol =
//       "SELECT solution_id FROM user_solutions WHERE user_id = " + user_id + " AND is_active != 0";
//     rows_sol = await db.query(sql_sol);
//     if(rows_sol.length == 0) {
//       return null;
//     }
//     const solutionIDsArray = rows_sol.map((obj) => obj.solution_id);

//     //Find number of questions and mandatory questions
//     const sql_q = `SELECT q.solution_id, s.solution_name, q.question_id, q.mandatory, a.user_answers FROM questions q JOIN solutions s ON s.solution_id = q.solution_id 
//     LEFT JOIN user_answers a ON q.question_id = a.question_id WHERE q.solution_id IN (${solutionIDsArray.join(
//       ","
//     )}) AND q.order_id != 0 order by q.solution_id, q.cat_id, q.sub_cat_id, q.order_id;`;
//     const rows_q = await db.query(sql_q);

//     // if(rows_q.length == 0) {
//     //   logger.warn("No records found for the given input");
//     //   const result = {};
//     //   result.statusCode = 500;
//     //   result.status = 'Failure';
//     //   result.message = 'No records found for the given input';
    
//     // return result;
//     // }

//     temp = [
//       {
//         solution_id: rows_q[0].solution_id,
//         solution_name: rows_q[0].solution_name,
//         question_count: null,
//         answer_count: null,
//         unanswered_count: null,
//         mandatory_qcount: null,
//         mandatory_acount: null,
//         mandatory_unanswered: null,
//       },
//     ];

//     rows_q.forEach((item) => {
//       const count = temp.some(
//         (temp_item) => temp_item.solution_id === item.solution_id
//       );
//       if (!count) {
//         temp.push({
//           solution_id: item.solution_id,
//           solution_name: item.solution_name,
//           question_count: null,
//           answer_count: null,
//           mandatory_qcount: null,
//           mandatory_acount: null,
//         });
//       }
//     });

//     temp.forEach((temp_item) => {
//       let counter = 0;
//       let mandatory_counter = 0;
//       rows_q.forEach((item) => {
//         if (temp_item.solution_id == item.solution_id) {
//           counter++;
//           if (item.mandatory) {
//             mandatory_counter++;
//           }
//         }
//         temp_item.question_count = counter;
//         temp_item.mandatory_qcount = mandatory_counter;
//       });
//     });

//     //Find number of questions ANSWERED in each category
//     const sql_a = `SELECT q.solution_id, q.mandatory, a.user_answers FROM user_answers a JOIN questions q ON q.question_id = a.question_id WHERE q.solution_id IN (${solutionIDsArray.join(
//       ","
//     )}) AND a.user_answers != '' AND JSON_LENGTH(a.user_answers) != 0 AND a.user_answers IS NOT NULL;`;
//     const rows_a = await db.query(sql_a);

//     // if(rows_a.length == 0) {
//     //   logger.warn("No records found for the given input");
//     //   const result = {};
//     //   result.statusCode = 500;
//     //   result.status = 'Failure';
//     //   result.message = 'No records found for the given input';
    
//     // return result;
//     // }
//     temp.forEach((temp_item) => {
//       let counter = 0;
//       let mandatory_counter = 0;
//       rows_a.forEach((item) => {
//         if (
//           temp_item.solution_id === item.solution_id &&
//           item.user_answers !== null && item.user_answers != "" && item.user_answers != [] ) {
//           counter++;
//           if (item.mandatory) mandatory_counter++;
//         }
//       });

//       temp_item.answer_count = counter;
//       temp_item.mandatory_acount = mandatory_counter;
//     });

//     //To calculate unanswered count and add to the array
//     temp.forEach((item) => {
//       item.unanswered_count = item.question_count - item.answer_count;
//       item.mandatory_unanswered = item.mandatory_qcount - item.mandatory_acount;
//     });
//     logger.info(`Solution Status retrieved successfully`);

//     return temp;
//   } catch (err) {
//     logger.error(`An error occurred while retrieving solution status: ${err.message}`);
//     console.error(err.originalError); // Log the original error details
//     throw new Error(
//       `An error occurred while retrieving solution status: ${err.message}`
//     );
//   }
// }

async function getSolutionsStatus(user_id) {
  try {
    //Find the solutions that are mapped to the given user_id
    const sql_sol =
      "SELECT solution_id FROM user_solutions WHERE user_id = " + user_id + " AND is_active != 0";
    rows_sol = await db.query(sql_sol);
    if(rows_sol.length == 0) {
      return null;
    }
    const solutionIDsArray = rows_sol.map((obj) => obj.solution_id);

    const sql = `SELECT 
    so.solution_id, 
    so.solution_name,
    COUNT(q.question) AS question_count, 
    CAST(COALESCE(SUM(CASE WHEN a.user_ans_id IS NOT NULL AND a.user_answers != '' AND JSON_LENGTH(a.user_answers) != 0 THEN 1 ELSE 0 END), 0) AS SIGNED) AS answer_count,
    COUNT(CASE WHEN a.user_ans_id IS NULL OR a.user_answers = '' OR JSON_LENGTH(a.user_answers) = 0 THEN 1 END) AS unanswered_count,
    COUNT(q.mandatory) AS mandatory_qcount, 
    CAST(COALESCE(SUM(CASE WHEN a.user_ans_id IS NOT NULL AND a.user_answers != '' AND JSON_LENGTH(a.user_answers) != 0 AND q.mandatory THEN 1 ELSE 0 END), 0) AS SIGNED) AS mandatory_acount,
    COUNT(CASE WHEN (a.user_ans_id IS NULL OR a.user_answers = '' OR JSON_LENGTH(a.user_answers) = 0) AND q.mandatory THEN 1 END) AS unanswered_mandatory_count
FROM 
    questions q 
JOIN 
    solutions so ON so.solution_id = q.solution_id 
LEFT JOIN 
    user_answers a ON q.question_id = a.question_id 
WHERE 
    q.solution_id IN (${solutionIDsArray.join(
      ","
    )})
    AND q.order_id != 0 
GROUP BY 
    so.solution_id, so.solution_name;
`
    const rows= await db.query(sql);

    logger.info(`Solution Status retrieved successfully`);

    return rows;
  } catch (err) {
    logger.error(`An error occurred while retrieving solution status: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new Error(
      `An error occurred while retrieving solution status: ${err.message}`
    );
  }
}

//This function is used to get all the fields from all the tables to dump in versioning table
async function collectDetails_Versioning(solution_id) {
  try {
    //Add a check here to see if user is only CA
    const sql =
      "SELECT s.solution_id, c.cat_id, q.sub_cat_id, q.question_id, " +
      "q.question, q.question, q.question_type, q.follow_up, q.order_id, pa.possible_answer_id, pa.poss_answer, u.user_ans_id, u.user_answers, " +
      "u.updated_by, u.updated_on " +
      "FROM solutions s JOIN questions q ON s.solution_id = q.solution_id " +
      "JOIN sub_category sc ON q.sub_cat_id = sc.sub_cat_id " +
      "JOIN categories c ON q.cat_id = c.cat_id " +
      "LEFT JOIN user_answers u ON q.question_id = u.question_id " +
      "LEFT JOIN question_GroupAnsOption qg ON qg.question_id=q.question_id " +
      "LEFT JOIN possible_answers pa ON pa.group_id = qg.group_id " +
      "LEFT JOIN solution_answer_status sa ON s.solution_id = sa.solution_id " +
      " WHERE s.solution_id = " + solution_id + " order by q.solution_id, q.cat_id, q.sub_cat_id, q.order_id;";

    const rows = await db.query(sql);
    const temp = [];

    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        if (rows[i].question_id === rows[j].question_id) {
          if (!temp.some((item) => item.question_id === rows[i].question_id)) {
            const {
              solution_id,
              cat_id,
              sub_cat_id,
              question_id,
              question_type,
              question,
              follow_up,
              order_id,
              user_ans_id,
              user_answers,
            } = rows[i];
            temp.push({
              solution_id,
              cat_id,
              sub_cat_id,
              question_id,
              question_type,
              question,
              follow_up,
              order_id,
              user_ans_id,
              user_answers,
            });
          }
        } else {
          if (!temp.some((item) => item.question_id === rows[i].question_id)) {
            const {
              solution_id,
              cat_id,
              sub_cat_id,
              question_id,
              question_type,
              question,
              follow_up,
              order_id,
              user_ans_id,
              user_answers,
            } = rows[i];
            temp.push({
              solution_id,
              cat_id,
              sub_cat_id,
              question_id,
              question_type,
              question,
              follow_up,
              order_id,
              user_ans_id,
              user_answers,
            });
          }
        }
      }
    }
    //To push the last row into the temp object
    if (
      !temp.some(
        (item) => item.question_id === rows[rows.length - 1].question_id
      )
    ) {
      const {
        solution_id,
        cat_id,
        sub_cat_id,
        question_id,
        question_type,
        question,
        follow_up,
        order_id,
        user_ans_id,
        user_answers,
      } = rows[rows.length - 1];
      temp.push({
        solution_id,
        cat_id,
        sub_cat_id,
        question_id,
        question_type,
        question,
        follow_up,
        order_id,
        user_ans_id,
        user_answers,
      });
    }
    rows.forEach((row_id) => {
      temp.forEach((val, j) => {
        if (val.question_id === row_id.question_id) {
          if (
            row_id.poss_answer == undefined &&
            row_id.possible_answer_id == undefined
          ) {
            temp[j].answerlist = null;
          } else {
            if (temp[j].answerlist !== undefined) {
              temp[j].answerlist.push({
                answer: row_id.poss_answer,
                possible_answer_id: row_id.possible_answer_id,
              });
            } else {
              temp[j].answerlist = [
                {
                  answer: row_id.poss_answer,
                  possible_answer_id: row_id.possible_answer_id,
                },
              ];
            }
          }
        }
      });
    });

    logger.info(`Versioning Details collected for insert versioning successfully`);

    return temp;
    //Push into array
    // const temp_array = [temp];
    // return temp_array;
  } catch (err) {
    logger.error(`An error occurred while retrieving versioning details for insert versioning: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new Error(
      `An error occurred while retrieving versioning details for insert versioning: ${err.message}`
    );
  }
}

// async function InsertVersioning(req) {
//   const solution_id = req.body.solution_id;
//   const user_id = req.body.user_id;
//   const comments = req.body.comments;
//   const description = req.body.description;
//   const created_by = req.body.created_by;
//   const created_on = req.body.created_on;

//   //Check if the input received is valid before processing them
//   if (
//     solution_id == undefined ||
//     user_id == undefined ||
//     comments == undefined ||
//     comments == "" ||
//     description === undefined ||
//     description == "" ||
//     created_by == undefined ||
//     created_on == undefined
//   ) {
//     console.error(
//       "Please enter all values - solution_id, user_id, comments, description created_by, created_on and in their correct format"
//     );
//     return null;
//   }

//   //Call function to get details for versioning
//   const rows = await collectDetails_Versioning(solution_id);
//   const sql_version =
//     "SELECT max(id) FROM version_master WHERE solution_id = " + solution_id;
//   const counter = await db.query(sql_version);

//   let version_no = 0;
//   if (counter[0]["max(id)"] === null) {
//     version_no = 1;
//   } else {
//     // version_no = parseInt(counter[0]["max(version_no)"], 10) + 1;
//     version_no = parseInt(counter[0]["max(id)"]) + 1;
//   }

//   let sql_insert =
//     "INSERT INTO version_master (solution_id, version_no,version_comments, version_description, created_by, created_on) VALUES(?,?,?,?,?,now())";

//   let values = [solution_id, version_no, comments, description, user_id];

//   try {
//     const rows = await db.query(sql_insert, values);
//   } catch (err) {
//     console.error(err.originalError); // Log the original error details
//     throw new Error(
//       `An error occurred while inserting data in version master: ${err.message}`
//     );
//   }

//     //Lock the table for reading while inserting records
//    //await db.query('LOCK TABLES versioning WRITE;');

//   for (let item of rows) {
//     sql_insert =
//       "INSERT INTO versioning (cat_id, sub_cat_id, question_id, question_type, " +
//       " question, poss_answer_data, user_ans_id, user_answers, version_no, created_by " +
//       " ) VALUES(?,?,?,?,?,?,?,?,?,?)";

//     item.answerlist = JSON.stringify(item.answerlist);

//     values = [
//       item.cat_id,
//       item.sub_cat_id,
//       item.question_id,
//       item.question_type,
//       item.question,
//       item.answerlist,
//       item.user_ans_id,
//       item.user_answers === null ? null : JSON.stringify(item.user_answers),
//       version_no,
//       user_id,
//     ];

//     try {
//       //Take file backup if file has been
//       if (item.question_type == "file" && item.user_answers != null) {
//         const file = item.user_answers[0].answers;
//         const sourceFilePath = path.join(sourceFolderPath, file);
//         const destinationNewFolderPath = path.join(
//           destinationFolderPath,
//           `version_${version_no}`
//         );
//         const destinationFilePath = path.join(destinationNewFolderPath, file);

//         //Check if file is present before copying
//         fs.access(sourceFilePath, fs.constants.F_OK, (err) => {
//           if (err) {
//             console.log(`File ${file} does not exist in the directory.`);
//           } else {
//             //Check if directory exists, if no then create new directory
//             if (fs.existsSync(destinationNewFolderPath)) {
//               fs.copyFileSync(sourceFilePath, destinationFilePath);
//             } else {
//               fs.mkdirSync(destinationNewFolderPath);
//               // Use fs.copyFileSync to copy files synchronously
//               fs.copyFileSync(sourceFilePath, destinationFilePath);
//               console.log(`Copied file: ${file}`);
//             }
//           }
//         });
//       }
//       const rows = await db.query(sql_insert, values);
//     } catch (err) {
//       // Handle any potential errors here
//       console.error(err.originalError); // Log the original error details
//       throw new Error(
//         `An error occurred while retrieving versioning details: ${err.message}`
//       );
//     }
//   }
//   //Unlock table once versioning is done
//   //await db.query('UNLOCK TABLES;');
// }

async function InsertVersioning(req) {
  const solution_id = req.body.solution_id;
  const user_id = req.body.user_id;
  const comments = req.body.comments;
  const description = req.body.description;
  const created_by = req.body.created_by;
  const created_on = req.body.created_on;

  //Check if the input received is valid before processing them
  if (
    solution_id == undefined ||
    user_id == undefined ||
//    comments == undefined ||
//    comments == "" ||
    description === undefined ||
    description == "" ||
    created_by == undefined ||
    created_on == undefined
  ) {
    console.error(
      "Please enter all values - solution_id, user_id, comments, description created_by, created_on and in their correct format"
    );
    return null;
  }

  //Call function to get details for versioning
  const rows = await collectDetails_Versioning(solution_id);
  let version_no = 0;

try {
  const sql_version =
    "SELECT MAX(version_no) AS version_no FROM version_master WHERE solution_id = " + solution_id;
  const counter = await db.query(sql_version);
  logger.info('max id retrieved successfully in insert versioning function')

  if (counter[0].version_no === null) {
    version_no = 1;
  } else {
    // version_no = parseInt(counter[0]["max(version_no)"], 10) + 1;
    version_no = counter[0].version_no + 1;
  }

  let sql_insert =
    "INSERT INTO version_master (solution_id, version_no,version_comments, version_description, created_by, created_on) VALUES(?,?,?,?,?,now())";

  let values = [solution_id, version_no, comments, description, user_id];

    const rows = await db.query(sql_insert, values);

  } catch (err) {
    logger.error(`An error occurred while inserting data in version master: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new Error(
      `An error occurred while inserting data in version master: ${err.message}`
    );
  }

    //Lock the table for reading while inserting records
   //await db.query('LOCK TABLES versioning WRITE;');

    //Remove records if question has follow_up field
   for (let item of rows) {
   // if (typeof item.follow_up == 'string') item.follow_up = JSON.parse(item.follow_up);
         if(item.follow_up != null && item.user_answers != null && item.user_answers != "") {
          //console.log(item.question_id)
          var matching_entry = item.follow_up.find(ques => ques.criteria !== item.user_answers);
          if(matching_entry) {
          var question_remove_id = matching_entry.id;
  
          //check the user_ans_id of that question in the user_answers table
          const user_ans_id = await db.query('SELECT user_ans_id FROM user_answers WHERE question_id = ?', [question_remove_id]);
          
          //remove record from the table
          if(user_ans_id.length > 0) {
            await db.query('DELETE FROM user_answers WHERE user_ans_id = ?', [user_ans_id[0].user_ans_id]);
          console.log(`Record ${user_ans_id[0].user_ans_id} deleted`);
          }
          }
        }
      }

  //Insert the records in versioning table
  for (let item of rows) {

    sql_insert =
      "INSERT INTO versioning (cat_id, sub_cat_id, question_id, question_type, " +
      " question, poss_answer_data, user_ans_id, user_answers, version_no, created_by, created_on, order_id, follow_up) VALUES(?,?,?,?,?,?,?,?,?,?,now(),?,?)";

    item.answerlist = JSON.stringify(item.answerlist);
    

    values = [
      item.cat_id,
      item.sub_cat_id,
      item.question_id,
      item.question_type,
      item.question,
      item.answerlist,
      item.user_ans_id,
      item.user_answers === null ? null : JSON.stringify(item.user_answers),
      version_no,
      user_id,
      item.order_id,
      item.follow_up === null ? null : JSON.stringify(item.follow_up)
    ];

    try {
      //Take file backup if file has been uploaded
      if (item.question_type == "file" && item.user_answers != null) {
        const file = item.user_answers[0].answers;
        const sourceFilePath = path.join(sourceFolderPath, file);
        //If versioning folder doesnt exist, then create it
        if (!fs.existsSync(destinationFolderPath)) {
          fs.mkdirSync(destinationFolderPath);
        }
        const destinationNewFolderPath = path.join(
          destinationFolderPath,
          `version_${version_no}`
        );
        const destinationFilePath = path.join(destinationNewFolderPath, file);

        //Check if file is present before copying
        fs.access(sourceFilePath, fs.constants.F_OK, (err) => {
          if (err) {
            console.log(`File ${file} does not exist in the directory.`);
          } else {
            //Check if directory exists, if no then create new directory
            if (fs.existsSync(destinationNewFolderPath)) {
              fs.copyFileSync(sourceFilePath, destinationFilePath);
            } else {
              fs.mkdirSync(destinationNewFolderPath);
              // Use fs.copyFileSync to copy files synchronously
              fs.copyFileSync(sourceFilePath, destinationFilePath);
              console.log(`Copied file: ${file}`);
            }
          }
        });
      }


      const rows = await db.query(sql_insert, values);
    } catch (err) {
      // Handle any potential errors here
      logger.error(`An error occurred while retrieving versioning details: ${err.message}`);
      console.error(err.originalError); // Log the original error details
      throw new Error(
        `An error occurred while retrieving versioning details: ${err.message}`
      );
    }
}
logger.info(`Versioning details retrieved successfully`);
  //Unlock table once versioning is done
  //await db.query('UNLOCK TABLES;');
  const result = {};
  result.statusCode = 200;
  result.status = 'Success';
  result.message = 'Version created successfully';
  return result;
}

async function getVersioningDetails(solution_id, version_no) {
  // const sql =
  //   "SELECT vm.solution_id,vm.created_on, v.version_no, u.user_name, vm.version_description, v.cat_id, v.sub_cat_id,s.solution_name, c.cat_name, sc.sub_cat_name, v.question_type,v.version_no, v.question_id, v.order_id, question, v.follow_up, poss_answer_data, user_ans_id, user_answers ,v.version_no" +
  //   " FROM versioning v " +
  //   "join version_master vm on vm.version_no=v.version_no " +
  //   " left join solutions s on s.solution_id=vm.solution_id " +
  //   " left join categories c on c.cat_id=v.cat_id " +
  //   " left join sub_category sc on sc.sub_cat_id=v.sub_cat_id " +
  //   " left join users u on u.user_id=vm.created_by " +
  //   " WHERE v.version_no = " +
  //   version_no +
  //   " AND " +
  //   " vm.solution_id = " +
  //   solution_id + " order by s.solution_id, s.order_id, c.cat_id, c.order_id, sc.sub_cat_id, sc.order_id";

  const sql = 'SELECT vm.solution_id, vm.created_on, v.version_no, u.user_name, vm.version_description, v.cat_id,v.sub_cat_id,s.solution_name,c.cat_name,sc.sub_cat_name,v.question_type,v.version_no,v.question_id,v.order_id,v.question,v.follow_up,v.poss_answer_data,v.user_ans_id,v.user_answers,v.version_no FROM ' +
  'versioning v JOIN version_master vm ON vm.version_no = v.version_no ' +
'LEFT JOIN solutions s ON s.solution_id = vm.solution_id ' +
'LEFT JOIN categories c ON c.cat_id = v.cat_id ' +
'LEFT JOIN sub_category sc ON sc.sub_cat_id = v.sub_cat_id ' +
'LEFT JOIN users u ON u.user_id = vm.created_by ' +
'JOIN categories c2 ON c2.cat_id = v.cat_id ' +
'JOIN solutions s2 ON s2.solution_id = c2.solution_id ' +
'WHERE v.version_no = ' + version_no + ' AND  vm.solution_id = ' + solution_id +' AND  s2.solution_id = ' + solution_id +
' ORDER BY s.solution_id, s.order_id, c.cat_id, c.order_id, sc.sub_cat_id, sc.order_id;'
  const rows = await db.query(sql);

  if (rows.length == 0) return null;
  // Create an object to store the final result
  const result = {
    solution: {
      solution_id: rows[0].solution_id,
      solution_name: rows[0].solution_name,
      version_no: rows[0].version_no,
      user_name: rows[0].user_name,
      version_description: rows[0].version_description,
      created_on: rows[0].created_on
    },
    categorieslist: [],
  };

  // Create a helper function to find a category by ID
  function findCategory(categories, cat_id) {
    return categories.find(
      (categorylist) => categorylist.category.cat_id === cat_id
    );
  }

  // To ensure that questions are printed only once
  const questionMap = new Map();
  let subCategory;
  let category;
  rows.forEach((item) => {

    const {
      cat_id,
      cat_name,
      sub_cat_id,
      sub_cat_name,
      question_id,
      order_id,
      question,
      follow_up,
      question_type,
      mandatory,
      poss_answer_data,
      user_ans_id,
      user_answers,
    } = item;

        //Convert to json format
        //if (typeof item.follow_up == 'string') item.follow_up = JSON.parse(item.follow_up);
//        if (typeof item.user_answers == 'string') {console.log("user_answers", user_answers); item.user_answers = JSON.parse(item.user_answers);}
        //if (typeof item.poss_answer_data == 'string') item.poss_answer_data = JSON.parse(item.poss_answer_data);

    category = findCategory(result.categorieslist, cat_id);

    if (!category) {
      // Create a new category
      const newCategory = {
        category: {
          cat_id,
          cat_name,
          sub_category_list: [],
        },
      };

      result.categorieslist.push(newCategory);
    }

    // Find the category again after adding it
    const updatedCategory = findCategory(result.categorieslist, cat_id);

    subCategory = updatedCategory.category.sub_category_list.find(
      (subCat) => subCat.sub_cat_id === sub_cat_id
    );

    if (!subCategory) {
      // Create a new sub-category
      updatedCategory.category.sub_category_list.push({
        sub_cat_id,
        sub_cat_name,
        qalist: [],
      });
    }

    // Find the sub-category again after adding it
    const updatedSubCategory = updatedCategory.category.sub_category_list.find(
      (subCat) => subCat.sub_cat_id === sub_cat_id
    );

    // Check if the question is already in the map
    if (!questionMap.has(question_id)) {
      // Create a new question object
      const questionObj = {
        question_id,
        order_id,
        question,
        follow_up,
        question_type,
        mandatory,
        user_answers: [],
        updated_by: item.updated_by,
        updated_on: item.updated_on,
        answerlist: null,
      };

      // Add a default user answer object
      questionObj.user_answers.push({
        ans_id: item.user_ans_id,
        answer: item.user_answers,
      });

      // Add the question to the map
      questionMap.set(question_id, questionObj);

      updatedSubCategory.qalist.push(questionObj);
    } else {
      // If the question is already in the map, update the user_answers array
      const updatedQuestion = questionMap.get(question_id);
      const ansIdExists = updatedQuestion.user_answers.some(
        (answer) => answer.ans_id === item.user_ans_id
      );

      if (!ansIdExists) {
        updatedQuestion.user_answers.push({
          ans_id: item.user_ans_id,
          answer: item.user_answers,
        });
      }
    }

    // Find possible answers for the question
    if (item.possible_answer_id !== null) {
      const updatedQuestion = questionMap.get(question_id);

      if (!updatedQuestion.answerlist) {
        updatedQuestion.answerlist = [];
      }

      // updatedQuestion.answerlist.push(
      //   item.poss_answer_data,
      // );
      updatedQuestion.answerlist = item.poss_answer_data;

      /* It needs to be validated for multi select case, radio buttons
  updatedQuestion.answerlist.push({
        answer: item.poss_answer,
        possible_answer_id: item.possible_answer_id,
      });*/
    }
  });

  //Push into array
  const temp_array = [result];
  return temp_array;
}

async function getVersionNumbers(solution_id = null,user_id) {
  // let sql =
  //   "SELECT vm.version_no, vm.version_comments, vm.version_description, vm.created_on, vm.created_by, vm.solution_id,s.solution_name, s.order_id  FROM version_master vm " +
  //   " left join  solutions s on s.solution_id=vm.solution_id ";
console.log(user_id)
//  Check if the user has access to the solutions
  if(user_id == null || user_id == "") {
    logger.error("Please send user_id");
    return null;
  }
  let solutions;
  try {
  const sql_solution_find = 'SELECT solution_id FROM user_solutions WHERE user_id = ? AND is_active !=0'
  const rows_solution_find = await db.query(sql_solution_find, user_id); 
  solutions = rows_solution_find.map(obj => obj.solution_id);
  if(solutions.length == 0) {
    logger.info("User has no access to any solutions");
    const result = {};
    result.statusCode = 200;
    result.status = 'Success';
    result.message = 'User has no access to any solutions';
    result.data = [];
    return result;
  }
} catch (err) {
  logger.error(`An error occurred while retrieving version numbers: ${err.message}`);
  console.error(err.originalError); // Log the original error details
  throw new Error(
    `An error occurred while retrieving version numbers: ${err.message}`);
  }
  let sql;
  let params = [];
  if(solution_id != null) {
  sql = "SELECT vm.version_no, vm.version_comments,u.user_name, vm.version_description, vm.created_on, vm.created_by, vm.solution_id,s.solution_name, s.order_id  FROM version_master vm " +
  " left join  solutions s on s.solution_id=vm.solution_id" +
  "left join users u on u.user_id=vm.created_by WHERE vm.solution_id = ?" ;
  params = [solution_id]
  } else {
  sql = "SELECT vm.version_no, vm.version_comments,u.user_name, vm.version_description, vm.created_on, vm.created_by, vm.solution_id,s.solution_name, s.order_id  FROM version_master vm " +
  " left join  solutions s on s.solution_id=vm.solution_id " +
  "left join users u on u.user_id=vm.created_by WHERE s.solution_id IN (?)";
  params = [solutions]
  }
  //if (solution_id != null) sql += " WHERE vm.solution_id = " + solution_id;

  //console.log(sql);
  try {
    const rows = await db.query(sql,params);

    if(rows.length == 0) {
      logger.info(`No versions created`);
      return {
        statusCode: 200,
        status: "Success",
        message: "No versions created",
        data: rows,
      };
    }
    logger.info(`Version numbers retrieved successfully`);

    return {
      statusCode: 200,
      status: "Success",
      message: "Version numbers retrieved succesfully",
      data: rows,
    };
  } catch (err) {
    logger.error(`An error occurred while retrieving version numbers: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new Error(
      `An error occurred while retrieving version numbers: ${err.message}`
    );
  }
}

async function mandatoryStatus(solution_id, category_id) {
    if(solution_id == null) {
      return null;
    }
    //category wise status
    if(category_id == null) {
      const sql_cat = 'SELECT c.cat_id, c.cat_name, ' +
      'CAST(COUNT(q.question_id) AS SIGNED) AS question_count, ' +
      'CAST(COALESCE(SUM(q.mandatory), 0) AS SIGNED) AS mandatory_question_count, ' +
      "CAST(COALESCE(SUM(CASE WHEN a.user_ans_id IS NOT NULL AND a.user_answers != '' AND JSON_LENGTH(a.user_answers) != 0 AND a.user_answers IS NOT NULL THEN 1 ELSE 0 END), 0) AS SIGNED) AS answers_count, " +
      `CAST(COALESCE(SUM(CASE WHEN q.mandatory AND a.user_ans_id IS NOT NULL AND a.user_answers != '' AND JSON_LENGTH(a.user_answers) != 0 THEN 1 ELSE 0 END), 0) AS SIGNED) AS mandatory_answers_count ` +
      'FROM ' +
      'categories c ' +
      'JOIN questions q ON c.cat_id = q.cat_id ' +
      'LEFT JOIN user_answers a ON q.question_id = a.question_id ' +
      'WHERE ' +
      'q.solution_id = ' + solution_id +
      ' GROUP BY c.cat_id, c.cat_name;';


    try {
      const rows_cat = await db.query(sql_cat);
      if (rows_cat.length > 0) {
        //if all mandatory questions are answered then mandatory_filled_status will be true, else false
        rows_cat.forEach((row) => {
          row.mandatory_filled_status = row.mandatory_question_count - row.mandatory_answers_count === 0;
        });
    } 
    logger.info(`Category status retrieved successful`);
    return rows_cat;
    }catch(error) {
      logger.error(`An error occurred while retrieving category status: ${error.message}`);
      console.error(error.originalError); // Log the original error details
      throw new Error(
        `An error occurred while retrieving category status: ${error.message}`
      );
    }
  }
    //sub_category wise status
    const sql_sub_cat = 'SELECT ' +
    //'c.cat_id, ' +
    //'c.cat_name, ' +
    'q.sub_cat_id, ' +
    's.order_id AS sub_cat_order_id, ' +
    's.sub_cat_name, ' +
    'CAST(COUNT(q.question) AS SIGNED) AS question_count, ' +
    'CAST(COALESCE(SUM(q.mandatory), 0) AS SIGNED) AS mandatory_question_count, ' +
    "CAST(COALESCE(SUM(CASE WHEN a.user_ans_id IS NOT NULL AND a.user_answers != '' AND JSON_LENGTH(a.user_answers) != 0 AND a.user_answers IS NOT NULL THEN 1 ELSE 0 END), 0) AS SIGNED) AS answers_count, " +
    `CAST(COALESCE(SUM(CASE WHEN q.mandatory AND a.user_ans_id IS NOT NULL AND a.user_answers != '' AND JSON_LENGTH(a.user_answers) != 0 THEN 1 ELSE 0 END), 0) AS SIGNED) AS mandatory_answers_count ` +
    'FROM questions q ' +
    'JOIN categories c ON q.cat_id = c.cat_id ' +
    'JOIN sub_category s ON s.sub_cat_id = q.sub_cat_id ' +
    'LEFT JOIN user_answers a ON q.question_id = a.question_id ' +
    'WHERE q.solution_id = ' + solution_id + ' AND q.cat_id = ' + category_id +
    ' GROUP BY q.cat_id, q.sub_cat_id;';


    try {
      const rows_sub_cat = await db.query(sql_sub_cat);
      if (rows_sub_cat.length > 0) {
        //if all mandatory questions are answered then mandatory_filled_status will be true, else false
        rows_sub_cat.forEach((row) => {
          row.mandatory_filled_status = row.mandatory_question_count - row.mandatory_answers_count === 0;
        });
    } 
    logger.info(`Sub_category status retrieved successfully`);

    return rows_sub_cat;
    }catch(err) {
      logger.error(`An error occurred while retrieving sub_category status: ${err.message}`);
      console.error(err.originalError); // Log the original error details
      throw new Error(
        `An error occurred while retrieving sub_category status: ${err.message}`
      );
    }
}

async function mandatoryStatusAll(solution_id) {
  if(solution_id == null) {
    return null;
  }
  //category wise status
    const sql_cat = 'SELECT c.cat_id, c.cat_name, ' +
    'CAST(COUNT(q.question_id) AS SIGNED) AS question_count, ' +
    'CAST(COALESCE(SUM(q.mandatory), 0) AS SIGNED) AS mandatory_question_count, ' +
    "CAST(COALESCE(SUM(CASE WHEN a.user_ans_id IS NOT NULL AND a.user_answers != '' AND JSON_LENGTH(a.user_answers) != 0 AND a.user_answers IS NOT NULL THEN 1 ELSE 0 END), 0) AS SIGNED) AS answers_count, " +
    `CAST(COALESCE(SUM(CASE WHEN q.mandatory AND a.user_ans_id IS NOT NULL AND a.user_answers != '' AND JSON_LENGTH(a.user_answers) != 0 THEN 1 ELSE 0 END), 0) AS SIGNED) AS mandatory_answers_count ` +
    'FROM ' +
    'categories c ' +
    'JOIN questions q ON c.cat_id = c.cat_id ' +
    'LEFT JOIN user_answers a ON q.question_id = a.question_id ' +
    'WHERE ' +
    'q.solution_id = ' + solution_id +
    ' GROUP BY c.cat_id, c.cat_name;';


  try {
    const rows_cat = await db.query(sql_cat);
    if (rows_cat.length > 0) {
      //if all mandatory questions are answered then mandatory_filled_status will be true, else false
      rows_cat.forEach((row) => {
        row.mandatory_filled_status = row.mandatory_question_count - row.mandatory_answers_count === 0;
      });
  } 
  logger.info(`mandatoryStatusAll status retrieved successfully`);
  return rows_cat;
  }catch(error) {
    logger.error(`An error occurred while retrieving mandatoryStatusAll status: ${error.message}`);
    console.error(error.originalError); // Log the original error details
    throw new Error(
      `An error occurred while retrieving mandatoryStatusAll status: ${error.message}`
    );
  }
}


async function mandatoryStatusSubCategory(solution_id) {
  if(solution_id == null) {
    return null;
  }

  //sub_category wise status
  const sql_sub_cat = 'SELECT ' +
  'c.cat_id, ' +
  'c.cat_name, ' +
  'q.sub_cat_id, ' +
  's.order_id AS sub_cat_order_id, ' +
  's.sub_cat_name, ' +
  'CAST(COUNT(q.question) AS SIGNED) AS question_count, ' +
  'CAST(COALESCE(SUM(q.mandatory), 0) AS SIGNED) AS mandatory_question_count, ' +
  "CAST(COALESCE(SUM(CASE WHEN a.user_ans_id IS NOT NULL AND a.user_answers != '' AND a.user_answers IS NOT NULL AND JSON_LENGTH(a.user_answers) != 0 THEN 1 ELSE 0 END), 0) AS SIGNED) AS answers_count, " +
  `CAST(COALESCE(SUM(CASE WHEN q.mandatory AND a.user_ans_id IS NOT NULL AND a.user_answers != '' AND JSON_LENGTH(a.user_answers) != 0 THEN 1 ELSE 0 END), 0) AS SIGNED) AS mandatory_answers_count ` +
  'FROM questions q ' +
  'JOIN categories c ON q.cat_id = c.cat_id ' +
  'JOIN sub_category s ON s.sub_cat_id = q.sub_cat_id ' +
  'LEFT JOIN user_answers a ON q.question_id = a.question_id ' +
  'WHERE q.solution_id = ' + solution_id + 
  ' GROUP BY q.cat_id, q.sub_cat_id;';

  try {
    const rows_sub_cat = await db.query(sql_sub_cat);
    if (rows_sub_cat.length > 0) {
      //if all mandatory questions are answered then mandatory_filled_status will be true, else false
      rows_sub_cat.forEach((row) => {
        row.mandatory_filled_status = row.mandatory_question_count - row.mandatory_answers_count === 0;
      });
  } 
  logger.info(`Sub_category status retrieved`);

  //return rows_sub_cat;

  const result = { categorieslist: [] };

  // Create a map to group data by category_id
  const categoryMap = new Map();
  rows_sub_cat.forEach((item) => {
      const { cat_id, cat_name, sub_cat_id, sub_cat_order_id, sub_cat_name, ...rest } = item;
      if (!categoryMap.has(cat_id)) {
          categoryMap.set(cat_id, {
              category: { cat_id, cat_name, sub_category_list: [] },
              subCategories: new Map(),
          });
      }

      const category = categoryMap.get(cat_id);
      if (!category.subCategories.has(sub_cat_id)) {
          category.subCategories.set(sub_cat_id, { sub_cat_id, sub_cat_order_id, sub_cat_name, ...rest });
      }
  });

  // Convert the map to the desired format
  categoryMap.forEach(({ category, subCategories }) => {
      category.sub_category_list = Array.from(subCategories.values());
      result.categorieslist.push(category);
  });

  return result;

  }catch(error) {
    logger.error(`An error occurred while retrieving sub_category status: ${error.message}`);
    console.error(error.originalError); // Log the original error details
    throw new Error(
      `An error occurred while retrieving sub_category status: ${error.message}`
    );
  }
}

async function insertArchitecture (body) {

  const { version_no, description, architecture_name, created_by, created_on } = body;

//   const sql_version =
//   "SELECT max(version_no) FROM architecture";
// const counter = await db.query(sql_version);
// logger.info('max id retrieved successfully in insert architecture function')
// let version_no;
// if (counter[0]["max(version_no)"] === null) {
//   version_no = 1;
// } else {
//   // version_no = parseInt(counter[0]["max(version_no)"], 10) + 1;
//   version_no = parseInt(counter[0]["max(version_no)"]) + 1;
// }
  // const file_location = `${configFile.folderPath}\\Architecture\\version_${version_no}\\${architecture_name}`
  const file_location = path.join(configFile.folderPath,'Architecture', `version_${version_no}`,architecture_name)
  console.log(file_location)

  const sql = 'INSERT INTO architecture (version_no, description, architecture_name,file_location,created_by,created_on) VALUES(?,?,?,?,?,?)';
  try {
  const rows = await db.query(sql, [
    version_no,
  description,
  architecture_name,
  file_location,
  created_by,
  created_on
  ]);

  logger.info(`Acrhitecture details inserted successfully`);
  // //Get version number
  // const version_find = await db.query('SELECT version_no FROM architecture WHERE architecture_name = ?',[architecture_name])
  // console.log(version_find)
  // const version_no = version_find[0].version_no;
  
  const result = {};
  result.statusCode = 200;
  result.status = 'Success';
  result.message = 'Uploaded successfully';
  result.version_no = version_no;
  return result;
  } catch (err) {
      logger.error(`Error inserting in architecture table: ${err.message}`);
      console.error(err.originalError); // Log the original error details
      throw new  Error(`An error inserting in architecture table: ${err.message}`);
  }
}

async function getArchitecture (version_no) {
  const sql = 'SELECT * FROM architecture WHERE version_no = ?';
  
  try{
      const rows = await db.query(sql,[version_no]);
      logger.info(`Architecture details retrieved successfully`);
      return rows;
  } catch (err) {
      logger.error(`An error occurred while retrieving architecture details: ${err.message}`);
      console.error(err.originalError); // Log the original error details
      throw new  Error(`An error occurred while retrieving architecture details: ${err.message}`);
    }
}

async function deleteArchitecture (version_no) {
  const sql = "UPDATE architecture SET is_active = FALSE WHERE version_no = ?";
  try {
      const rows = await db.query(sql,[version_no]);
      if(rows.affectedRows >= 1) { 
        logger.info(`Architecture record with version_no ${version_no} deleted successfully`);
        const result = {};
        result.statusCode = 200;
        result.status = 'Success';
        result.message = 'Architecture record deleted successfully';
        return result;
        } else {
          logger.warn(`Architecture record not found for version_no: ${version_no}`);
          const result = {};
          result.statusCode = 500;
          result.status = 'Failure';
          result.message = 'Record not found';
          return result;  
        }
        
      } catch (err) {
        logger.error(`Error deleting architecture record with version_no ${version_no}: ${err.message}`);
        console.error(err.originalError); // Log the original error details
        throw new  Error(`An error occurred while deleting architecture record: ${err.message}`);
      }
}

async function insertSupportingDocuments (body) {
  const { version_no, sd_name, created_by, created_on } = body;
  //Pushing each file name to create new locations into sd_location. Now it will have location of each file
  const sd_location = sd_name.map(name => `${configFile.folderPath}\\Architecture\\version_${version_no}\\${name}`);

  const insertValues = sd_name.map((id, index) => [version_no, id, sd_location[index], created_by, created_on]);

  const sql = 'INSERT INTO supporting_documents (version_no, sd_name, sd_location, created_by, created_on) VALUES ?'
  try {
      const rows = await db.query(sql, [insertValues]);

      logger.info('Supporting documents record inserted successfully');
      const result = {};
      result.statusCode = 200;
      result.status = 'Success';
      result.message = 'Supporting documents record inserted successfully';
      return result;
  } catch (err) {
      logger.error(`Error inserting supporting  documents record: ${err.message}`);
      console.error(err.originalError); // Log the original error details
      throw new  Error(`An error occurred while inserting supporting document record: ${err.message}`);
    }
}

async function getSupportingDocuments (version_no) {
  const sql = 'SELECT * FROM supporting_documents WHERE version_no = ?';
  
  try{
      const rows = await db.query(sql,[version_no]);
      logger.info(`Supporting_documents details retrieved successfully`);
      return rows;
  } catch (err) {
      logger.error(`An error occurred while retrieving Supporting_documents details: ${err.message}`);
      console.error(err.originalError); // Log the original error details
      throw new  Error(`An error occurred while retrieving Supporting_documents details: ${err.message}`);
    }

}

async function deleteSupportingDocuments (version_no) {
  const sql = "UPDATE supporting_documents SET is_active = FALSE WHERE version_no = ?";
  try {
      const rows = await db.query(sql,[version_no]);
      if(rows.affectedRows >= 1) { 
        logger.info(`Supporting_documents record with version_no ${version_no} deleted successfully`);
        const result = {};
        result.statusCode = 200;
        result.status = 'Success';
        result.message = 'Supporting_documents record deleted successfully';
        return result;
        } else {
          logger.warn(`Supporting_documents record not found for version_no: ${version_no}`);
          const result = {};
          result.statusCode = 500;
          result.status = 'Failure';
          result.message = 'Record not found';
          return result;  
        }
        
      } catch (err) {
        logger.error(`Error deleting architecture record with version_no ${version_no}: ${err.message}`);
        console.error(err.originalError); // Log the original error details
        throw new  Error(`An error occurred while deleting architecture record: ${err.message}`);
      }
}

async function getArchitectureSDVersion (version_no = null,res) {
  let sql;
  let conditions = " ON a.version_no = sd.version_no";
  let params = [];

  if (version_no != null) {
    conditions += " WHERE a.version_no = ? ";
    params = [version_no];
  }
  sql = "SELECT a.version_no, a.architecture_name, a.file_location, a.description, sd.sd_name, sd.sd_location, a.created_by, a.created_on, a.is_active FROM architecture a LEFT JOIN supporting_documents sd " + conditions;

  try{
      const rows = await db.query(sql,params);
      if(rows.length == 0) {
        return null;
      }

      const architecture_name = rows[0].architecture_name;
      const file_location = rows[0].file_location;

  const filePath = path.join(file_location, architecture_name);
  // res.sendFile(filePath, function (err) {
  //   if (err) {
  //     console.log("Error occurred while sending file: ", err);
  //     res.status(err.status).end();
  //   } else {
  //     console.log("File sent successfully");
  //   }
  // });

  const groupedObject = rows.reduce((result, item) => {
    const version_no = item.version_no;
  
    if (!result[version_no]) {
      result[version_no] = {
        version_no: version_no,
        architecture_name: item.architecture_name,
        file_location: item.file_location,
        description: item.description,
        created_by: item.created_by,
        created_on: item.created_on,
        is_active: item.is_active,
        supporting_docs: []
      };
    }
  
    result[version_no].supporting_docs.push({
      sd_name: item.sd_name,
      sd_location: item.sd_location
    });
  
    return result;
  }, {});
  
  const groupedArray = Object.values(groupedObject);
  
      logger.info(`Architecture and supporting document details retrieved successfully`);
      return groupedArray;
  } catch (err) {
      logger.error(`An error occurred while retrieving architecture and supporting document details: ${err.message}`);
      console.error(err.originalError); // Log the original error details
      throw new  Error(`An error occurred while retrieving architecture and supporting document details: ${err.message}`);
    }
}

async function getVersionArchitecture(req){
try{
const rows = await db.query('SELECT version_no, description FROM architecture WHERE version_no = (SELECT MAX(version_no) FROM architecture);');
if(rows.length == 0) {
  return [{"version_no":"0", "description":"no  previous version"}];
}
logger.info(`Version no and description retrieved successfully in getVersionArchitecture`);

return rows;
} catch (err) {
  logger.error(`An error occurred while retrieving version_no and description in getVersionArchitecture: ${err.message}`);
  console.error(err.originalError); // Log the original error details
  throw new  Error(`An error occurred while retrieving version_no and description in getVersionArchitecture: ${err.message}`);
}
}

//For retrieving previous version in version_master
async function getPreviousVersionMaster(solution_id){
  try{
    const sql = 'SELECT MAX(version_no) AS version_no FROM version_master WHERE solution_id = ' + solution_id;
    ;
  const rows = await db.query(sql);
  console.log("IN getPreviousVersionMaster version_no = ", rows[0].version_no)
  logger.info(`Version no retrieved successfully in getPreviousVersionMaster`);
  
  return rows;
  } catch (err) {
    logger.error(`An error occurred while retrieving version_no from version_master: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new  Error(`An error occurred while retrieving version_no from version_master: ${err.message}`);
  }
  }

  
module.exports = {
  getAnswers,
  insertPossibleAnswer,
  fetchFile,
  fetchFilee,
  uploadFile,
  updatePossibleAnswer,
  insertUserAnswer,
  updateUserAnswer,
  updateAnswer,
  getCategoriesStatus,
  getSubCategoriesStatus,
  InsertVersioning,
  getVersioningDetails,
  getSolutionsStatus,
  getVersionNumbers,
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
  filePreview,
  mandatoryQuestions,
  mandatoryStatusAll,
  getPreviousVersionMaster
};
