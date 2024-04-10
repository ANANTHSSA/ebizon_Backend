const db = require("./dbService");
const fs = require('fs');
const logger = require("../middlewares/logHandler.js");


async function insertQuestion(body) {
  const { solution_id, cat_id, subCategory_id, question, question_type, mandatory, created_by, created_on, follow_up, order_id } = body;
  
//Check if the input received is valid before processing them
if(solution_id == undefined || cat_id == undefined || subCategory_id == undefined || question == undefined || question == "" || question_type == undefined || question_type == "" || mandatory == undefined || created_by == undefined || created_on == undefined || order_id == undefined ) {
  logger.warn('Please enter all values - solution_id, cat_id, subCategory_id, question, question_type, mandatory, created_by, created_on and in their correct format')
  console.error("Please enter all values - solution_id, cat_id, subCategory_id, question, question_type, mandatory, created_by, created_on and in their correct format");
  return null;
}

  const sql = `INSERT INTO questions (solution_id, cat_id, sub_cat_id, question, question_type, mandatory, created_by, created_on, follow_up, order_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
  
  try {
      const result = await db.query(sql, [
      solution_id, 
      cat_id, 
      subCategory_id,
      question, 
      question_type,
      mandatory, 
      created_by, 
      created_on, 
      follow_up,
      order_id
    ]);
    // Return the newly inserted data
    const insertedData = {
      solution_id,
      cat_id,
      subCategory_id,
      question,
      question_type,
      mandatory,
      created_by,
      created_on,
      follow_up,
      order_id
    };
    
    logger.info(`Question inserted successfully`);

    return {
      statusCode: 200,
      status: 'Success',
      message: 'Question inserted successfully',
      data: insertedData,
    };
  } catch (err) {
    logger.error(`An error occurred while inserting question: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new  Error(`An error occurred while inserting question: ${err.message}`);
}
  }

  async function updateQuestion(question_id,body) {

    const { question, question_type, mandatory, updated_by, updated_on, follow_up,is_active, order_id} = body;

      const updateFields = [];
      const updateValues = [];

      if (question !== undefined) {
      updateFields.push('question = ?');
      updateValues.push(question);
      }

      if (question_type !== undefined) {
      updateFields.push('question_type = ?');
      updateValues.push(question_type);
      }

      if (mandatory !== undefined) {
      updateFields.push('mandatory = ?');
      updateValues.push(mandatory);
      }

      if (follow_up !== undefined) {
        updateFields.push('follow_up = ?');
        updateValues.push(follow_up);
      }

      if (is_active !== undefined) {
        updateFields.push('is_active = ?');
        updateValues.push(is_active);
      }

      if (order_id !== undefined) {
        updateFields.push('order_id = ?');
        updateValues.push(order_id);
      }

      //Push updated_by and updated_on fields
      if(updated_by !== undefined && updated_on !== undefined) {
        updateFields.push('updated_by = ?, updated_on = ?');
        updateValues.push(updated_by, updated_on);
      }

      if (updateFields.length === 0) {
        // No fields to update
        return{message: "Nothing to update"};
      }

      const sql = `UPDATE questions SET ${updateFields.join(', ')} WHERE question_id = ?`;
      const updateParams = [...updateValues, question_id];

      try {
        await db.query(sql, updateParams);
      // Fetch and return the updated data
    const [updatedRows] = await db.query('SELECT * FROM questions WHERE question_id = ?', [question_id]);
    const updatedData = updatedRows[0];
    
    logger.info(`Updated question successfully`);

    return {
      statusCode: 200,
      status: 'Success',
      message: 'Question updated successfully',
      data: updatedData,
    };
    }catch (err) {
      logger.error(`An error occurred while updating question: ${err.message}`);
      console.error(err.originalError); // Log the original error details
     throw new  Error(`An error occurred while updating question: ${err.message}`);
}
  }

async function deleteQuestion(question_id) {    
  const sql =
  "UPDATE questions SET is_active = FALSE WHERE question_id= ?";
  try {
    logger.info(`Deleting question with ID: ${question_id}`);
   const rows= await db.query(sql,[question_id]);
    //Code review the query returns 1 row after update statement and return the response accordingly.
    if(rows.affectedRows >= 1) { 
      logger.info(`Question with ID ${question_id} deleted successfully`);
    const result = {};
    result.statusCode = 200;
    result.status = 'Success';
    result.message = 'Question deleted successfully';
    return result;
    } else {
      logger.warn(`Record not found for question ID: ${question_id}`);
      const result = {};
      result.statusCode = 500;
      result.status = 'Failure';
      result.message = 'Record not found';
      return result;  
    }
    
  } catch (err) {
    logger.error(`Error deleting question with ID ${question_id}: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new  Error(`An error occurred while deleting question: ${err.message}`);
  }
}

async function deleteQuestionExcel(question_id) {    
  const sql =
  "UPDATE questions_excel SET is_active = FALSE WHERE question_id= ?";
  try {
    logger.info(`Deleting question with ID: ${question_id}`);
   const rows= await db.query(sql,[question_id]);
    //Code review the query returns 1 row after update statement and return the response accordingly.
    if(rows.affectedRows >= 1) { 
      logger.info(`Question with ID ${question_id} deleted successfully`);
    const result = {};
    result.statusCode = 200;
    result.status = 'Success';
    result.message = 'Question deleted successfully';
    return result;
    } else {
      logger.warn(`Record not found for question ID: ${question_id}`);
      const result = {};
      result.statusCode = 500;
      result.status = 'Failure';
      result.message = 'Record not found';
      return result;  
    }
    
  } catch (err) {
    logger.error(`Error deleting question with ID ${question_id}: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new  Error(`An error occurred while deleting question: ${err.message}`);
  }
}


async function getQuestions(solution_id=null, category_id=null,subCategory_id=null) {
  let sql = "SELECT q.question_id, q.question, q.question_type, q.mandatory, q.follow_up," +
 "a.poss_answer, a.possible_answer_id FROM questions q " +
 " LEFT OUTER JOIN question_GroupAnsOption pg ON  q.question_id = pg.question_id " +
 " LEFT OUTER JOIN possible_answers a ON a.group_id= pg.group_id ";

 let params = [];
 if (solution_id != null && category_id != null && subCategory_id!= null) {
   sql += " WHERE  q.solution_id = ? AND q.cat_id = ? AND q.sub_cat_id = ? AND q.is_active != 0";
   params = [solution_id, category_id,subCategory_id];
 } else
 { 
  sql += " WHERE 1=1 AND q.is_active != 0 "
  if (solution_id != null) {
   sql += " AND  q.solution_id = ? ";
   params.push(solution_id);
    if (category_id != null) {
        sql += " AND q.cat_id = ? ";
        params.push(category_id);
     }
  }
}

let rows = await db.query(sql, params);

const temp = [];

for (let i = 0; i < rows.length; i++) {
  if (typeof rows[i].follow_up == 'string') rows[i].follow_up = JSON.parse(rows[i].follow_up);
  for (let j = i + 1; j < rows.length; j++) {

    if (rows[i].question_id === rows[j].question_id) {
        if (!temp.some(item => item.question_id === rows[i].question_id)) {
                      const {question_id, question, question_type, mandatory, follow_up} = rows[i];
                      temp.push({question_id, question, question_type, mandatory, follow_up});   
                              
        }
       
    } 
     else {
        if (!temp.some(item => item.question_id === rows[i].question_id)) {
                      const {question_id, question, question_type, mandatory, follow_up} = rows[i];
                      temp.push({question_id, question, question_type, mandatory, follow_up}); 
        }
    }
  }
}
//To push the last row into the temp object
if (!temp.some(item => item.question_id === rows[rows.length-1].question_id)) {
const {question_id, question, question_type, mandatory, follow_up} = rows[rows.length-1];
temp.push({question_id, question, question_type, mandatory, follow_up});
}
rows.forEach((row_id)=> {
temp.forEach((val,j)=>{
    if(val.question_id === row_id.question_id) {
      if(row_id.poss_answer == undefined && row_id.possible_answer_id == undefined) {
        temp[j].answerlist= null;

      } else {
        if(temp[j].answerlist!==undefined) {
            temp[j].answerlist.push({answer:row_id.poss_answer, possible_answer_id:row_id.possible_answer_id});
          } 
        else {    
            temp[j].answerlist=[{answer:row_id.poss_answer, possible_answer_id:row_id.possible_answer_id}];
          }
      }  
    }

})
})

  return temp;

}

async function getQuestionsExcel(solution_id=null, category_id=null,subCategory_id=null) {
  let sql = "SELECT q.question_id, q.question, q.question_type, q.mandatory, q.follow_up," +
 "a.poss_answer, a.possible_answer_id FROM questions_excel q " +
 " LEFT OUTER JOIN question_GroupAnsOption_excel pg ON  q.question_id = pg.question_id " +
 " LEFT OUTER JOIN possible_answers_excel a ON a.group_id= pg.group_id ";

 let params = [];
 if (solution_id != null && category_id != null && subCategory_id!= null) {
   sql += " WHERE  q.solution_id = ? AND q.cat_id = ? AND q.sub_cat_id = ? AND q.is_active != 0";
   params = [solution_id, category_id,subCategory_id];
 } else
 { 
  sql += " WHERE 1=1 AND q.is_active != 0 "
  if (solution_id != null) {
   sql += " AND  q.solution_id = ? ";
   params.push(solution_id);
    if (category_id != null) {
        sql += " AND q.cat_id = ? ";
        params.push(category_id);
     }
  }
}

let rows = await db.query(sql, params);

const temp = [];

for (let i = 0; i < rows.length; i++) {
  if (typeof rows[i].follow_up == 'string') rows[i].follow_up = JSON.parse(rows[i].follow_up);

  for (let j = i + 1; j < rows.length; j++) {

    if (rows[i].question_id === rows[j].question_id) {
       if (!temp.some(item => item.question_id === rows[i].question_id)) {
                    const {question_id, question, question_type, mandatory, follow_up} = rows[i];
                    temp.push({question_id, question, question_type, mandatory, follow_up});   
                             
       }
       
    } 
     else {
        if (!temp.some(item => item.question_id === rows[i].question_id)) {
                      const {question_id, question, question_type, mandatory, follow_up} = rows[i];
                      temp.push({question_id, question, question_type, mandatory, follow_up}); 
        }
    }
  }
}
//To push the last row into the temp object
if (!temp.some(item => item.question_id === rows[rows.length-1].question_id)) {
const {question_id, question, question_type, mandatory, follow_up} = rows[rows.length-1];
temp.push({question_id, question, question_type, mandatory, follow_up});
}
rows.forEach((row_id)=> {
temp.forEach((val,j)=>{
    if(val.question_id === row_id.question_id) {
      if(row_id.poss_answer == undefined && row_id.possible_answer_id == undefined) {
        temp[j].answerlist= null;

      } else {
        if(temp[j].answerlist!==undefined) {
            temp[j].answerlist.push({answer:row_id.poss_answer, possible_answer_id:row_id.possible_answer_id});
          } 
        else {    
            temp[j].answerlist=[{answer:row_id.poss_answer, possible_answer_id:row_id.possible_answer_id}];
          }
      }  
    }

})
})

  return temp;

}

//UNCOMMENT THE BELOW INSERT FUNCTION DURING PRODUCTION

// async function insertQuestionTemplate(body) {

//   //AD ORDER_ID LATER

//   const { solution_id, cat_id, subCategory_id, question, question_type, mandatory, created_by, created_on, follow_up, possible_answers } = body;
  
// //Check if the input received is valid before processing them
// if(solution_id == undefined || cat_id == undefined || subCategory_id == undefined || question == undefined || question == "" || question_type == undefined || question_type == "" || mandatory == undefined || created_by == undefined || created_on == undefined ) {
//   logger.warn('Please enter all values - solution_id, cat_id, subCategory_id, question, question_type, mandatory, created_by, created_on and in their correct format')
//   console.error("Please enter all values - solution_id, cat_id, subCategory_id, question, question_type, mandatory, created_by, created_on, follow_up, possible_answers and in their correct format");
//   return null;
// }

// const sql_counter = 'SELECT max(order_id) FROM questions WHERE solution_id = ' + solution_id + ' AND cat_id = ' + cat_id + ' AND sub_cat_id = ' + subCategory_id + ' ORDER BY order_id';
// const counter = await db.query(sql_counter);

// let order_id;
// if (counter[0]["max(order_id)"] === null) {
//   order_id = 1;
// } else {
//   order_id = parseInt(counter[0]["max(order_id)"]) + 1;
// }
// console.log("order_id",order_id)

// //Update all other order_id before inserting
// try {
// const sql_update_orderid = 'UPDATE questions SET order_id = order_id + 1 WHERE solution_id = ' + solution_id + ' AND cat_id = ' + cat_id + ' AND order_id >= ' + order_id;
// await db.query(sql_update_orderid);
// logger.info("Order_id updated");
// } catch (err) {
//   logger.error(`An error occurred while updating order_id through insertQuestiontemplate: ${err.message}`);
//   console.error(err.originalError); // Log the original error details
//   throw new  Error(`An error occurred while updating order_id through insertQuestiontemplate: ${err.message}`);
// }

// //Inserting question
//   const sql = `INSERT INTO questions (solution_id, cat_id, sub_cat_id, question, question_type, mandatory, created_by, created_on, follow_up, order_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?);`;
  
//   try {
//       const result = await db.query(sql, [
//       solution_id, 
//       cat_id, 
//       subCategory_id,
//       question, 
//       question_type,
//       mandatory, 
//       created_by, 
//       created_on, 
//       follow_up,
//       order_id
//     ]);
    
//   } catch (err) {
//     logger.error(`An error occurred while inserting question: ${err.message}`);
//     console.error(err.originalError); // Log the original error details
//     throw new  Error(`An error occurred while inserting question: ${err.message}`);
// }

// //Add possible answers if present
// if(possible_answers != undefined) {
//   let question_id;
//   const replacedQuestion = `'${question}'`;
//   try {
//   const sql_ques_find = 'SELECT question_id FROM questions WHERE question = ' + replacedQuestion + ' AND ' + 'cat_id = ' + cat_id + ' AND ' + 'sub_cat_id = ' + subCategory_id;
//   question_id = await db.query(sql_ques_find);
//   console.log("question_id", question_id);
//   } catch (err) {
//     logger.error(`An error occurred while searching question_id through insertQuestiontemplate: ${err.message}`);
//     console.error(err.originalError); // Log the original error details
//     throw new  Error(`An error occurred while while searching question_id through insertQuestiontemplate: ${err.message}`);
// }
// console.log("possible_answers", possible_answers);
// //convert all possible_answers to lower case to check through the possible_answers table
// const lowercaseAnswers = possible_answers.map(obj => obj.toLowerCase());
// //Sort the answers to compare with options from table
// const sorted_possible_answers = lowercaseAnswers.slice().sort();
// //Concatenate all the array values to use in the below query
// const concatenatedAnswers = sorted_possible_answers.join(',');
// // Remove spaces before and after commas
// const formattedAnswers = concatenatedAnswers.replace(/\s*,\s*/g, ',');

// const sql_find_option = `SELECT group_id
// FROM (
//   SELECT
//     group_id,
//     GROUP_CONCAT(TRIM(BOTH ' ' FROM LOWER(poss_answer)) ORDER BY LOWER(poss_answer)) AS answers
//   FROM
//     possible_answers
//   GROUP BY
//     group_id
// ) AS grouped_answers
// WHERE
//   answers = LOWER(?);`

//   const group_id = await db.query(sql_find_option, [formattedAnswers]);
//     //If there is a group_id then use the same
//     if(group_id.length != 0) {
//       console.log("Using same group_id", group_id[0].group_id)
//        //Entry into this loop, if all options are already present in the table
//        const sql_qid = 'INSERT INTO question_GroupAnsOption (question_id, group_id, created_by) VALUES (?,?,1)';
//        await db.query(sql_qid, [question_id[0].question_id, group_id[0].group_id])
//       } else {
//         console.log("Creating new group_id")
    
//           //Add new group with group_id in the table 
//            const counter_group_id = await db.query('SELECT max(group_id) FROM possible_answer_group');
//            let group_id_name = 0;
//       if (counter_group_id[0]["max(group_id)"] === null) {
//         group_id_name = 1;
//       } else {
//         group_id_name = parseInt(counter_group_id[0]["max(group_id)"]) + 1;
//       }
//       const group_name = `${possible_answers[0]}_${group_id_name}`;
//        await db.query('INSERT INTO possible_answer_group (group_name) VALUES (?)',[group_name]);
//        //Check the group_id for the new group
//       const sql_group_id = 'SELECT group_id FROM possible_answer_group WHERE group_name = ?';
//       const group_id_insert = await db.query(sql_group_id, [group_name]);
//       console.log("group_id_insert",group_id_insert[0].group_id);
//       //Insert the possible answers into possible_answers_excel group with the group id
//       const insertedValues = possible_answers.map(item => [group_id_insert[0].group_id, item, 1]);
//       console.log("insertedValues",insertedValues)
//       await db.query('INSERT INTO possible_answers (group_id, poss_answer, created_by) VALUES ?', [insertedValues]);
//       //Now enter the question id and the group id in the table question_GroupAnsOption_excel
//       const sql_qid = 'INSERT INTO question_GroupAnsOption (question_id, group_id, created_by) VALUES (?,?,?)';
//       await db.query(sql_qid, [question_id[0].question_id, group_id_insert[0].group_id,1])
//   }
// }
// logger.info('Single question insertion complete');
// }




//Below function for testing purpose
async function insertQuestionTemplate(body) {

  const { solution_id, cat_id, subCategory_id, question, question_type, mandatory, created_by, created_on, follow_up, possible_answers } = body;
  
  let order_id = body.order_id;
  console.log("calling insertQuestionTemplate")
  console.log("order_id",order_id);

//Check if the input received is valid before processing them
if(solution_id == undefined || cat_id == undefined || subCategory_id == undefined || question == undefined || question == "" || question_type == undefined || question_type == "" || mandatory == undefined || created_by == undefined || created_on == undefined ) {
  logger.warn('Please enter all values - solution_id, cat_id, subCategory_id, question, question_type, mandatory, created_by, created_on and in their correct format')
  console.error("Please enter all values - solution_id, cat_id, subCategory_id, question, question_type, mandatory, created_by, created_on, follow_up, possible_answers and in their correct format");
  return null;
}

const sql_counter = 'SELECT max(order_id) FROM questions_excel WHERE solution_id = ' + solution_id + ' AND cat_id = ' + cat_id + ' AND sub_cat_id = ' + subCategory_id + ' ORDER BY order_id';
const counter = await db.query(sql_counter);

//let order_id;
if(order_id !== 0){
if (counter[0]["max(order_id)"] === null) {
  order_id = 1;
} else {
  order_id = parseInt(counter[0]["max(order_id)"]) + 1;
}
console.log("order_id",order_id)
}

//Update all other order_id before inserting
try {
const sql_update_orderid = 'UPDATE questions_excel SET order_id = order_id + 1 WHERE solution_id = ' + solution_id + ' AND cat_id = ' + cat_id + ' AND order_id >= ' + order_id;
//Change the order_id of all other below questions only if its a parent question
if(order_id !==0) {
await db.query(sql_update_orderid);
logger.info("Order_id updated");
}
} catch (err) {
  logger.error(`An error occurred while updating order_id through insertQuestiontemplate: ${err.message}`);
  console.error(err.originalError); // Log the original error details
  throw new  Error(`An error occurred while updating order_id through insertQuestiontemplate: ${err.message}`);
}

//Inserting question
  const sql = `INSERT INTO questions_excel (solution_id, cat_id, sub_cat_id, question, question_type, mandatory, created_by, created_on, follow_up, order_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?);`;
  
  try {
      const result = await db.query(sql, [
      solution_id, 
      cat_id, 
      subCategory_id,
      question, 
      question_type,
      mandatory, 
      created_by, 
      created_on, 
      follow_up,
      order_id
    ]);
    
  } catch (err) {
    logger.error(`An error occurred while inserting question: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new  Error(`An error occurred while inserting question: ${err.message}`);
}

//Add possible answers if present
if(possible_answers != undefined) {
  let question_id;
  const replacedQuestion = `'${question}'`;
  try {
  const sql_ques_find = 'SELECT question_id FROM questions_excel WHERE question = ' + replacedQuestion + ' AND ' + 'solution_id = ' + solution_id + ' AND cat_id = ' + cat_id + ' AND ' + 'sub_cat_id = ' + subCategory_id;
  question_id = await db.query(sql_ques_find);
  console.log("question_id", question_id);
  } catch (err) {
    logger.error(`An error occurred while searching question_id through insertQuestiontemplate: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new  Error(`An error occurred while while searching question_id through insertQuestiontemplate: ${err.message}`);
}

console.log("possible_answers", possible_answers);
//convert all possible_answers to lower case to check through the possible_answers table
const lowercaseAnswers = possible_answers.map(obj => obj.toLowerCase());
//Sort the answers to compare with options from table
const sorted_possible_answers = lowercaseAnswers.slice().sort();
//Concatenate all the array values to use in the below query
const concatenatedAnswers = sorted_possible_answers.join(',');
// Remove spaces before and after commas
const formattedAnswers = concatenatedAnswers.replace(/\s*,\s*/g, ',');

const sql_find_option = `SELECT group_id
FROM (
  SELECT
    group_id,
    GROUP_CONCAT(TRIM(BOTH ' ' FROM LOWER(poss_answer)) ORDER BY LOWER(poss_answer)) AS answers
  FROM
    possible_answers_excel
  GROUP BY
    group_id
) AS grouped_answers
WHERE
  answers = LOWER(?);`

  const group_id = await db.query(sql_find_option, [formattedAnswers]);
    //If there is a group_id then use the same
    if(group_id.length != 0) {
      console.log("Using same group_id", group_id[0].group_id)
       //Entry into this loop, if all options are already present in the table
       const sql_qid = 'INSERT INTO question_GroupAnsOption_excel (question_id, group_id, created_by) VALUES (?,?,1)';
       await db.query(sql_qid, [question_id[0].question_id, group_id[0].group_id])
      } else {
        console.log("Creating new group_id")
    
          //Add new group with group_id in the table 
           const counter_group_id = await db.query('SELECT max(group_id) FROM possible_answer_group_excel');
           let group_id_name = 0;
      if (counter_group_id[0]["max(group_id)"] === null) {
        group_id_name = 1;
      } else {
        group_id_name = parseInt(counter_group_id[0]["max(group_id)"]) + 1;
      }
      const group_name = `${possible_answers[0]}_${group_id_name}`;
       await db.query('INSERT INTO possible_answer_group_excel (group_name) VALUES (?)',[group_name]);
       //Check the group_id for the new group
      const sql_group_id = 'SELECT group_id FROM possible_answer_group_excel WHERE group_name = ?';
      const group_id_insert = await db.query(sql_group_id, [group_name]);
      console.log("group_id_insert",group_id_insert[0].group_id);
      //Insert the possible answers into possible_answers_excel group with the group id
      const insertedValues = possible_answers.map(item => [group_id_insert[0].group_id, item, 1]);
      console.log("insertedValues",insertedValues)
      await db.query('INSERT INTO possible_answers_excel (group_id, poss_answer, created_by) VALUES ?', [insertedValues]);
      //Now enter the question id and the group id in the table question_GroupAnsOption_excel
      const sql_qid = 'INSERT INTO question_GroupAnsOption_excel (question_id, group_id, created_by) VALUES (?,?,?)';
      await db.query(sql_qid, [question_id[0].question_id, group_id_insert[0].group_id,1])
  }
}

const replacedQuestion = `'${question}'`;

const sql_ques_find = 'SELECT question_id FROM questions_excel WHERE question = ' + replacedQuestion + ' AND ' + 'solution_id = ' + solution_id + ' AND cat_id = ' + cat_id + ' AND ' + 'sub_cat_id = ' + subCategory_id;
 const question_id = await db.query(sql_ques_find);
 const id = question_id[0].question_id;

logger.info('Single question insertion complete');

const result = {};
result.statusCode = 200;
result.status = 'Success';
result.message = 'Single question insertion successful';
result.question_id = id;

return result;
}

//UNCOMMENT THE BELOW UPDATE FUNCTION DURING PRODUCTION

// async function updateQuestionTemplate(body) {

//   const { question_id, solution_id, cat_id, subCategory_id, question, question_type, mandatory, follow_up, possible_answers, updated_by, updated_on, is_active } = body;

//     const updateFields = [];
//     const updateValues = [];

//     if(question_id == null || solution_id == null || cat_id == null || subCategory_id == null) {
//       logger.warn("Please send question_id, solution_id, cat_id, subCategory_id to update question in updateQuestionTemplate")
//       return null;
//     }

//     if (question !== undefined) {
//     updateFields.push('question = ?');
//     updateValues.push(question);
//     }

//     if (question_type !== undefined) {
//     updateFields.push('question_type = ?');
//     updateValues.push(question_type);
//     }

//     if (mandatory !== undefined) {
//     updateFields.push('mandatory = ?');
//     updateValues.push(mandatory);
//     }

//     if (follow_up !== undefined) {
//       updateFields.push('follow_up = ?');
//       updateValues.push(follow_up);
//     }

//     if (is_active !== undefined) {
//       updateFields.push('is_active = ?');
//       updateValues.push(is_active);
//     }

//     //Push updated_by and updated_on fields
//       updateFields.push('updated_by = ?, updated_on = ?');
//       updateValues.push(updated_by, updated_on);
    
//     if (updateFields.length === 0) {
//       // No fields to update
//       return{message: "Nothing to update"};
//     }

//     const sql = `UPDATE questions SET ${updateFields.join(', ')} WHERE question_id = ?`;
//     const updateParams = [...updateValues, question_id];

//     try {
//       await db.query(sql, updateParams);

//   }catch (err) {
//     logger.error(`An error occurred while updating question in updateQuestionTemplate: ${err.message}`);
//     console.error(err.originalError); // Log the original error details
//    throw new  Error(`An error occurred while updating question in updateQuestionTemplate: ${err.message}`);
// }

// if(possible_answers != undefined) {
//   let question_id;
//   try {
//     const sql_ques_find = 'SELECT question_id FROM questions WHERE question = ' + replacedQuestion + 'AND solution_id = ' + solution_id + ' AND cat_id = ' + cat_id + ' AND ' + 'sub_cat_id = ' + subCategory_id;
//     question_id = await db.query(sql_ques_find);
//     console.log("question_id", question_id);
//     } catch (err) {
//       logger.error(`An error occurred while searching question_id through insertQuestiontemplate: ${err.message}`);
//       console.error(err.originalError); // Log the original error details
//       throw new  Error(`An error occurred while while searching question_id through insertQuestiontemplate: ${err.message}`);
//   }

//   console.log("possible_answers", possible_answers);
// //Below code - check if there is a group_id for the given possible_answers

// //convert all possible_answers to lower case to check through the possible_answers table
// const lowercaseAnswers = possible_answers.map(obj => obj.toLowerCase());
// //Sort the answers to compare with options from table
// const sorted_possible_answers = lowercaseAnswers.slice().sort();
// //Concatenate all the array values to use in the below query
// const concatenatedAnswers = sorted_possible_answers.join(',');
// // Remove spaces before and after commas
// const formattedAnswers = concatenatedAnswers.replace(/\s*,\s*/g, ',');

// const sql_find_option = `SELECT group_id
// FROM (
//   SELECT
//     group_id,
//     GROUP_CONCAT(TRIM(BOTH ' ' FROM LOWER(poss_answer)) ORDER BY LOWER(poss_answer)) AS answers
//   FROM
//     possible_answers
//   GROUP BY
//     group_id
// ) AS grouped_answers
// WHERE
//   answers = LOWER(?);`

//   const group_id = await db.query(sql_find_option, [formattedAnswers]);

//   //If there is no group_id then create one
//   let group_id_new;
//   if(group_id.length == 0) {
//     console.log("Creating new group_id")
    
//           //Add new group with group_id in the table 
//            const counter_group_id = await db.query('SELECT max(group_id) FROM possible_answer_group');
//            let group_id_name = 0;
//       if (counter_group_id[0]["max(group_id)"] === null) {
//         group_id_name = 1;
//       } else {
//         group_id_name = parseInt(counter_group_id[0]["max(group_id)"]) + 1;
//       }
//       const group_name = `${possible_answers[0]}_${group_id_name}`;
//        await db.query('INSERT INTO possible_answer_group (group_name) VALUES (?)',[group_name]);
//        //Check the group_id for the new group
//       const sql_group_id = 'SELECT group_id FROM possible_answer_group WHERE group_name = ?';
//        group_id_new = await db.query(sql_group_id, [group_name]);
//       console.log("group_id_insert",group_id_insert[0].group_id);
//       //Insert the possible answers into possible_answers table with the group id
//       const insertedValues = possible_answers.map(item => [group_id_new[0].group_id, item, 1]);
//       console.log("insertedValues",insertedValues)
//       await db.query('INSERT INTO possible_answers (group_id, poss_answer, created_by) VALUES ?', [insertedValues]);
//   }

//       //check if we are using the old group_id (group_id) or new group_id (group_id_new)
//        let group_id_insert;
//        if(group_id.length != 0) {
//            group_id_insert = group_id;
//        } else {
//          group_id_insert = group_id_new;
//        }
  
//   //Check if there is question-group_id mapping in question_GroupAnsOption table
//   try{
//     const group_id_mapping = await db.query('SELECT * FROM question_GroupAnsOption WHERE question_id = ' + question_id);

//     if(group_id_mapping.length == 0) {
//       //If no mapping in question_GroupAnsOption table, then insert mapping in the table

//       await db.query('INSERT INTO question_GroupAnsOption (question_id, group_id, created_by) VALUES (?,?,?)', [question_id, group_id_insert[0].group_id,1])
//     } else {
// //Since there is mapping in question_GroupAnsOption update the group_id

// await db.query('UPDATE question_GroupAnsOption SET group_id = ? WHERE question_id = ?', [group_id_insert[0].group_id,question_id])
//     }
//   } catch (err) {
//     logger.error(`An error occurred while finding mapping in updateQuestionTemplate: ${err.message}`);
//     console.error(err.originalError); // Log the original error details
//    throw new  Error(`An error occurred while finding mapping in updateQuestionTemplate: ${err.message}`);
//   }
// }
// }

//BELOW FUNCTION ONLY FOR TESTING
async function updateQuestionTemplate(body) {

  const { question_id, solution_id, cat_id, subCategory_id, question, question_type, mandatory, follow_up, possible_answers, updated_by, updated_on } = body;

    const updateFields = [];
    const updateValues = [];

    if(solution_id == null || cat_id == null || subCategory_id == null) {
      logger.warn("Please send solution_id, cat_id, subCategory_id to update question in updateQuestionTemplate")
      return null;
    }

    // //Find question_id for the given question
    // const question_id_find  = await db.query('SELECT question_id FROM questions_excel WHERE question = ?',[question]);

    // if(question_id_find.length == null) {
    //   logger.error('No such question in the database');
    //   return null;
    // }
    
    // const question_id = question_id_find[0].question_id;

    if (question !== undefined) {
    updateFields.push('question = ?');
    updateValues.push(question);
    }

    if (question_type !== undefined) {
    updateFields.push('question_type = ?');
    updateValues.push(question_type);
    }

    if (mandatory !== undefined) {
    updateFields.push('mandatory = ?');
    updateValues.push(mandatory);
    }

    if (follow_up !== undefined) {
      updateFields.push('follow_up = ?');
      updateValues.push(follow_up);
    }

    //Push updated_by and updated_on fields
      updateFields.push('updated_by = ?, updated_on = ?');
      updateValues.push(updated_by, updated_on);
    
    if (updateFields.length === 0) {
      // No fields to update
      return{message: "Nothing to update"};
    }

    const sql = `UPDATE questions_excel SET ${updateFields.join(', ')} WHERE question_id = ?`;
    const updateParams = [...updateValues, question_id];

    try {
      await db.query(sql, updateParams);

  }catch (err) {
    logger.error(`An error occurred while updating question in updateQuestionTemplate: ${err.message}`);
    console.error(err.originalError); // Log the original error details
   throw new  Error(`An error occurred while updating question in updateQuestionTemplate: ${err.message}`);
}

if(possible_answers != null) {
  console.log("possible_answers", possible_answers);
//Below code - check if there is a group_id for the given possible_answers
//Filter all answer key values and convert all possible_answers to lower case to check through the possible_answers table
const changed_possible_answers = possible_answers.map(obj => obj.answer);
const lowercaseAnswers = possible_answers.map(obj => obj.answer.toLowerCase());
//Sort the answers to compare with options from table
const sorted_possible_answers = lowercaseAnswers.slice().sort();
//Concatenate all the array values to use in the below query
const concatenatedAnswers = sorted_possible_answers.join(',');
// Remove spaces before and after commas
const formattedAnswers = concatenatedAnswers.replace(/\s*,\s*/g, ',');

const sql_find_option = `SELECT group_id
FROM (
  SELECT
    group_id,
    GROUP_CONCAT(TRIM(BOTH ' ' FROM LOWER(poss_answer)) ORDER BY LOWER(poss_answer)) AS answers
  FROM
    possible_answers_excel
  GROUP BY
    group_id
) AS grouped_answers
WHERE
  answers = LOWER(?);`

  const group_id = await db.query(sql_find_option, [formattedAnswers]);

  //If there is no group_id then create one
  let group_id_new;
  if(group_id.length == 0) {
    console.log("Creating new group_id")
    
          //Add new group with group_id in the table 
           const counter_group_id = await db.query('SELECT max(group_id) FROM possible_answer_group_excel');
           let group_id_name = 0;
      if (counter_group_id[0]["max(group_id)"] === null) {
        group_id_name = 1;
      } else {
        group_id_name = parseInt(counter_group_id[0]["max(group_id)"]) + 1;
      }
      const group_name = `${changed_possible_answers[0]}_${group_id_name}`;
       await db.query('INSERT INTO possible_answer_group_excel (group_name) VALUES (?)',[group_name]);
       //Check the group_id for the new group
      const sql_group_id = 'SELECT group_id FROM possible_answer_group_excel WHERE group_name = ?';
       group_id_new = await db.query(sql_group_id, [group_name]);
      console.log("group_id_insert",group_id_new[0].group_id);
      //Insert the possible answers into possible_answers_excel group with the group id
      const insertedValues = changed_possible_answers.map(item => [group_id_new[0].group_id, item, 1]);
      console.log("insertedValues",insertedValues)
      await db.query('INSERT INTO possible_answers_excel (group_id, poss_answer, created_by) VALUES ?', [insertedValues]);
  }

      //check if we are using the old group_id (group_id) or new group_id (group_id_new)
       let group_id_insert;
       if(group_id.length != 0) {
           group_id_insert = group_id;
       } else {
         group_id_insert = group_id_new;
       }
  
  //Check if there is question-group_id mapping in question_GroupAnsOption_excel table
  try{
    const group_id_mapping = await db.query('SELECT * FROM question_GroupAnsOption_excel WHERE question_id = ' + question_id);
    if(group_id_mapping.length == 0) {
      //If no mapping in question_GroupAnsOption_excel table, then insert mapping in the table
      console.log("Inserting in question_GroupAnsOption_excel table")
      await db.query('INSERT INTO question_GroupAnsOption_excel (question_id, group_id, created_by) VALUES (?,?,?)', [question_id, group_id_insert[0].group_id,1])
    } else {
//Since there is mapping in question_GroupAnsOption_excel update the group_id
console.log("Updating in question_GroupAnsOption_excel table")
await db.query('UPDATE question_GroupAnsOption_excel SET group_id = ? WHERE question_id = ?', [group_id_insert[0].group_id,question_id])
    }
  } catch (err) {
    logger.error(`An error occurred while finding mapping in updateQuestionTemplate: ${err.message}`);
    console.error(err.originalError); // Log the original error details
   throw new  Error(`An error occurred while finding mapping in updateQuestionTemplate: ${err.message}`);
  }
}
logger.info("SINGLE QUESTION UPDATE SUCCESSFULL")
const result = {};
result.statusCode = 200;
result.status = 'Success';
result.message = 'Single Question Update Successful';
return result;
}

async function processExcel(body, solution_id, cat_id) {
  const rows = body;

  //To trim extra spaces
  const trimmedData = rows.map(item => ({
    ...item,
    AnswerOptions: item.AnswerOptions ? item.AnswerOptions.trim() : undefined
  }));

  let order_id = 0;
  const groupedRows = trimmedData.reduce((acc, row) => {
    const subCatName = row["Sub-Category"];
  
    // Find the existing entry in the accumulator
    const existingEntry = acc.find(entry => entry.sub_cat_name === subCatName);
  
    // Split AnswerOptions based on \r\n and create an array of objects
    const possibleAnswersArray = (row["AnswerOptions"] || "")
      .split("\r\n")
      .map(answer => ({ answer }));
  if (possibleAnswersArray!="" && row["Question Description"] !="" && row["Q. Type"]!="" ) {
    if (existingEntry) {
      order_id++;
      // If entry already exists, add to the qalist array
      existingEntry.qalist.push({
        question: row["Question Description"],
        question_type: row["Q. Type"],
        order_id: order_id,
        possible_answers: possibleAnswersArray
      });
    } else {
      order_id++;
      // If entry doesn't exist, create a new entry
      acc.push({
        sub_cat_name: subCatName,
        qalist: [
          {
            question: row["Question Description"],
            question_type: row["Q. Type"],
            order_id: order_id,
            possible_answers: possibleAnswersArray
          }
        ]
      });
    }
  }
    return acc;
  }, []);
  

  const rows_new = groupedRows.filter((obj => obj.sub_cat_name !== 'Sub-Category'));
  const filteredData = rows_new.filter(item => item.sub_cat_name !== undefined);

  //  const cat_id = 48;
  //  const solution_id = 2;

    const jsonString = JSON.stringify(filteredData, null, 2); // The '2' is for indentation
fs.writeFileSync('output3.json', jsonString);

  for (let item of filteredData) {
    //Adding single quotes to avoid syntax query
    const sub_cat_name = `'${item.sub_cat_name}'`;
     const sql_sub_cat_check = 'SELECT sub_cat_name FROM sub_category_excel WHERE sub_cat_name = ' + sub_cat_name;
    //const sql_sub_cat_check = 'SELECT sub_cat_name FROM sub_category WHERE sub_cat_name = ' + sub_cat_name;
    const if_sub_cat = await db.query(sql_sub_cat_check);

    if(if_sub_cat.length == 0) {
    const sql_sub_cat_orderid = 'SELECT max(order_id) FROM sub_category_excel';
    //const sql_sub_cat_orderid = 'SELECT max(order_id) FROM sub_category';
    const counter = await db.query(sql_sub_cat_orderid);
    let order_id = 0;
    if (counter[0]["max(order_id)"] === null) {
      order_id = 1;
    } else {
      // version_no = parseInt(counter[0]["max(version_no)"], 10) + 1;
      order_id = parseInt(counter[0]["max(order_id)"]) + 1;
    }
     const sql_sub_cat_insert = 'INSERT INTO sub_category_excel (cat_id, sub_cat_name, created_by, created_on, order_id) VALUES(?,?,1,now(),?)';
    //const sql_sub_cat_insert = 'INSERT INTO sub_category (cat_id, sub_cat_name, created_by, created_on, order_id) VALUES(?,?,1,now(),?)';
    await db.query(sql_sub_cat_insert, [cat_id, item.sub_cat_name, order_id]);
    }
    //Find the sub_cat_id of the newly inserted record
     const sql_sub_cat_find = 'SELECT sub_cat_id FROM sub_category_excel WHERE sub_cat_name = ' + sub_cat_name + ' AND cat_id = ' + cat_id
    //const sql_sub_cat_find = 'SELECT sub_cat_id FROM sub_category WHERE sub_cat_name = ' + sub_cat_name + ' AND cat_id = ' + cat_id

    const sub_cat_id = await db.query(sql_sub_cat_find);
    console.log(sub_cat_name);
    console.log(sub_cat_id[0].sub_cat_id)
//    item.qalist.forEach(ques => {
  await Promise.all(item.qalist.map(async ques => {
      //Insert questions in question table
      await question_excel_insert(ques, solution_id, cat_id, sub_cat_id[0].sub_cat_id);
    }))
}
console.log("DATABASE INSERTION SUCCESSFUL")
}



async function question_excel_insert(ques, solution_id, cat_id, sub_cat_id ) {
          //Adding single quotes to avoid syntax error
          const replacedQuestion = `'${ques.question}'`;
           const sql_ques_check = 'SELECT * FROM questions_excel WHERE question = ? AND ' + ' solution_id = ? AND cat_id = ? AND sub_cat_id = ?';

          //const sql_ques_check = 'SELECT * FROM questions WHERE question = ? AND solution_id = ? AND cat_id = ? AND sub_cat_id = ?;'
          const ques_check = await db.query(sql_ques_check,[ques.question,solution_id,cat_id,sub_cat_id]);
          if(ques_check.length != 0) {
            return;
          }
          //Code review - finally return the success no of records & failed/duplicate records
                    //Insert questions in questions table
         const sql_ques_insert = 'INSERT INTO questions_excel (solution_id, cat_id, sub_cat_id, question, question_type, created_by, created_on, order_id) VALUES(?,?,?,?,?,1,now(),?)';
          //const sql_ques_insert = 'INSERT INTO questions (solution_id, cat_id, sub_cat_id, question, question_type, created_by, created_on, order_id) VALUES(?,?,?,?,?,1,now(),?)';
          await db.query(sql_ques_insert, [solution_id, cat_id, sub_cat_id, ques.question, ques.question_type, ques.order_id]);
          //Check if question has options, if yes then call question_GroupAnsOption function
          if(ques.possible_answers[0].answer != "") {
            const question = `'${ques.question}'`;
   const sql_ques_find = 'SELECT question_id FROM questions_excel WHERE question = ' + question + ' AND ' + 'cat_id = ' + cat_id + ' AND ' + 'sub_cat_id = ' + sub_cat_id
  //const sql_ques_find = 'SELECT question_id FROM questions WHERE question = ' + question + ' AND ' + 'cat_id = ' + cat_id + ' AND ' + 'sub_cat_id = ' + sub_cat_id
  const question_id = await db.query(sql_ques_find);
  //Push all the possible answer options that we got from excel into an array
  const lowercaseAnswers = ques.possible_answers.map(obj => obj.answer.toLowerCase());
  const possible_answers = ques.possible_answers.map(obj => obj.answer);

  //Find group_id of first option match in possible_answers table
  //Sort the answers from excel to compare with options from table
  const sorted_possible_answers = lowercaseAnswers.slice().sort();
console.log(sorted_possible_answers)
  //Concatenate all the array values to use in the below query
  const concatenatedAnswers = sorted_possible_answers.join(','); 
  // Remove spaces before and after commas
const formattedAnswers = concatenatedAnswers.replace(/\s*,\s*/g, ',');
console.log("formattedAnswers", formattedAnswers)

const sql_find_option = `SELECT group_id
FROM (
  SELECT
    group_id,
    GROUP_CONCAT(TRIM(BOTH ' ' FROM LOWER(poss_answer)) ORDER BY LOWER(poss_answer)) AS answers
  FROM
    possible_answers_excel
  GROUP BY
    group_id
) AS grouped_answers
WHERE
  answers = LOWER(?);`

// const sql_find_option = `SELECT group_id
// FROM (
//   SELECT
//     group_id,
//     GROUP_CONCAT(TRIM(BOTH ' ' FROM LOWER(poss_answer)) ORDER BY LOWER(poss_answer)) AS answers
//   FROM
//     possible_answers
//   GROUP BY
//     group_id
// ) AS grouped_answers
// WHERE
//   answers = LOWER(?);`

  const group_id = await db.query(sql_find_option, [formattedAnswers]);

  //If there is a group_id then use the same
  if(group_id.length != 0) {
console.log("Using same group_id", group_id[0].group_id)
            //Entry into this loop, if all options are already present in the table
             const sql_qid = 'INSERT INTO question_GroupAnsOption_excel (question_id, group_id, created_by) VALUES (?,?,1)';
            //const sql_qid = 'INSERT INTO question_GroupAnsOption (question_id, group_id, created_by) VALUES (?,?,1)';
            await db.query(sql_qid, [question_id[0].question_id, group_id[0].group_id])
         
  } else {
    console.log("Creating new group_id")

      //Add new group with group_id in the table 
       const counter_group_id = await db.query('SELECT max(group_id) FROM possible_answer_group_excel');
      //const counter_group_id = await db.query('SELECT max(group_id) FROM possible_answer_group');
      let group_id_name = 0;
      if (counter_group_id[0]["max(group_id)"] === null) {
        group_id_name = 1;
      } else {
        group_id_name = parseInt(counter_group_id[0]["max(group_id)"]) + 1;
      }
      const group_name = `${possible_answers[0]}_${group_id_name}`;
       await db.query('INSERT INTO possible_answer_group_excel (group_name) VALUES (?)',[group_name]);
      //await db.query('INSERT INTO possible_answer_group (group_name) VALUES (?)',[group_name]);
      //Check the group_id for the new group
      const sql_group_id = 'SELECT group_id FROM possible_answer_group_excel WHERE group_name = ?';
      //const sql_group_id = 'SELECT group_id FROM possible_answer_group WHERE group_name = ?';
      const group_id_insert = await db.query(sql_group_id, [group_name]);
      console.log("group_id_insert",group_id_insert[0].group_id);

      //Insert the possible answers into possible_answers_excel group with the group id
      const insertedValues = possible_answers.map(item => [group_id_insert[0].group_id, item, 1]);
      console.log("insertedValues",insertedValues)
       await db.query('INSERT INTO possible_answers_excel (group_id, poss_answer, created_by) VALUES ?', [insertedValues]);
      //await db.query('INSERT INTO possible_answers (group_id, poss_answer, created_by) VALUES ?', [insertedValues]);
      //Now enter the question id and the group id in the table question_GroupAnsOption_excel
       const sql_qid = 'INSERT INTO question_GroupAnsOption_excel (question_id, group_id, created_by) VALUES (?,?,?)';
      //const sql_qid = 'INSERT INTO question_GroupAnsOption (question_id, group_id, created_by) VALUES (?,?,?)';
      await db.query(sql_qid, [question_id[0].question_id, group_id_insert[0].group_id,1])
  }
          }
}



module.exports = {
    insertQuestion,
    updateQuestion,
    deleteQuestion,
    getQuestions,
    processExcel,
    insertQuestionTemplate,
    updateQuestionTemplate,
    deleteQuestionExcel,
    getQuestionsExcel
  }