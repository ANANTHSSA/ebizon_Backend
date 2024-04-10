//Get DB Objects from Controller and do the business logic then connect with Database. Finally return the user result object
//Define all CURD operations for User
const db = require("./dbService");
const logger = require("../middlewares/logHandler.js");


async function insertSolution(body) {

  const { solution_name, image, created_by, created_on} = body;

  //Check if the input received is valid before processing them
if( solution_name == undefined || solution_name == "" || image == undefined || image == "" || created_by == undefined || created_on == undefined) {
 logger.warn('Please enter all values - solution_name, image, created_by, created_on and in their correct format')
  console.error("Please enter all values - solution_name, image, created_by, created_on and in their correct format");
  return null;
}

  const sql =
    "INSERT INTO solutions (solution_name, image, created_by, created_on) VALUES (?,?,?,?)";
  try {
    await db.query(sql, [  
      solution_name, 
      image,
      created_by, 
      created_on
    ]);
    const result = {};
      result.statusCode = 200;
      result.status = 'Success';
      result.message = 'Solutions inserted successfully';
    return result;
  } catch (err) {
    console.error(err.originalError); // Log the original error details
    throw new  Error(`An error occurred while inserting solutions: ${err.message}`);
  }
}

async function updateSolution(solution_id,body) {

  const {solution_name, image, updated_by, updated_on, is_active } = body;
  
  const updateFields = [];
      const updateValues = [];

      if (solution_name !== undefined) {
      updateFields.push('solution_name = ?');
      updateValues.push(solution_name);
      }

      if (image !== undefined) {
      updateFields.push('image = ?');
      updateValues.push(image);
      }

      if (is_active !== undefined) {
        updateFields.push('is_active = ?');
        updateValues.push(is_active);
      }

      //Push updated_by and updated_on fields
        updateFields.push('updated_by = ?, updated_on = ?');
        updateValues.push(updated_by, updated_on);
      
      if (updateFields.length === 0) {
        // No fields to update
        return{message: "Nothing to update"};
      }

  const sql =
  `UPDATE solutions SET ${updateFields.join(', ')} WHERE solution_id = ?`;
  const updateParams = [...updateValues, solution_id];

  try {
    await db.query(sql, updateParams);
    // Fetch and return the updated data
    const [updatedRows] = await db.query('SELECT * FROM solutions WHERE solution_id = ?', [solution_id]);
    const updatedData = updatedRows[0];
    
    return {
      statusCode: 200,
      status: 'Success',
      message: 'Solution updated successfully',
      data: updatedData,
    };
  } catch (err) {
    console.error(err.originalError); // Log the original error details
    throw new  Error(`An error occurred while updating solution: ${err.message}`);
  }
}

//Api to get solutions based on role_id. This is used to display solutions in dropbar and solution_page in sign in page
async function getSolutions(user_id, role_id, solution_page) {

  //solution_page variable must be set 1 and sent from front end for solution Page displaying images. solution_page variable must be set 0 and sent from front end for drop bar during user_creation process
  try {
  
    const sql_map = "SELECT solution_id FROM user_solutions WHERE user_id = " + user_id + " AND is_active != 0";
    const rows_map = await db.query(sql_map);
    const solutionIDsArray = rows_map.map(obj => obj.solution_id);

    const sql_all = "SELECT * FROM solutions WHERE is_active !=0 order by order_id";
    const rows_all = await db.query(sql_all);

    let sol_temp = [];
    let sol_coming_soon = [];
    //Proceed into the loop if user has purchased any solutions
    if(solutionIDsArray.length != 0) {
    const sql_sol_ques = 'SELECT q.cat_id, s.solution_id, COUNT(q.question_id) AS question_count FROM solutions s LEFT JOIN questions q ON s.solution_id = q.solution_id AND q.solution_id IN (?) WHERE s.solution_id IN (?) GROUP BY q.cat_id, s.solution_id;';
    const rows_sol_ques = await db.query(sql_sol_ques,[solutionIDsArray,solutionIDsArray]);
    rows_sol_ques.forEach((item) => {
      if(item.question_count == 0) {
        sol_temp.push(item.solution_id);
      }
    })
     sol_coming_soon = sol_temp.filter((value, index) => sol_temp.indexOf(value) === index);

    }
    //Give access to solution 9 (Cloud Architecture)
    const sol_coming_soon_fil = sol_coming_soon.filter(element => element !== 9);
   
    if(solution_page == true || role_id ==2) {
      const result = {
        solution: rows_all,
        solutionIDsArray: solutionIDsArray,
        sol_coming_soon: sol_coming_soon_fil,
      } 
      const result_array = [result];
      logger.info('Solutions displayed successfully')
      return result_array;
    } else if(role_id == 3 || role_id==4) {
      const sql_select = `SELECT * FROM solutions WHERE solution_id  (${solutionIDsArray.join(',')}) order by order_id;`
      const rows_select = await db.query(sql_select);
      logger.info('Solutions displayed successfully')
      return rows_select;
      }
    } 
    catch (err) {
      logger.error(`Solutions not displayed successfully: ${err.message}`);
      console.error(err.originalError); // Log the original error details
      throw new  Error(`Solutions not displayed successfully: ${err.message}`);
  }
}

async function insertSolutionStatus(body) {

  const { solution_id, company_name, solution_ans_stat, pdf_path, comments, created_by, created_on, approved_by, approved_on, version_no } = body;

    //Check if the input received is valid before processing them
if(solution_id == undefined || solution_ans_stat == undefined || solution_ans_stat == "" || created_by == undefined || created_on == undefined) {
  logger.warn('Please enter all values - solution_id, solution_ans_stat, pdf_path, created_by, created_on and in their correct format')
  console.error("Please enter all values - solution_id, company_name, solution_ans_stat, pdf_path, created_by, created_on and in their correct format");
  return null;
}

    const sql =
      "INSERT INTO solution_answer_status (solution_id, company_name, solution_ans_stat, pdf_path, comments, version_no, created_by, created_on, approved_by, approved_on) VALUES (?,?,?,?,?,?,?,?,?,?);";
  
    try {
      await db.query(sql, [ 
        solution_id, 
        company_name, 
        solution_ans_stat, 
        pdf_path,
        comments,
        version_no,
        created_by, 
        created_on,
        approved_by, 
        approved_on
      ]);
      const result = {};
      result.statusCode = 200;
      result.status = 'Success';
      result.message = 'Final version submitted successfully';
      return result;
    } catch (err) {
      console.error(err.originalError); // Log the original error details
      throw new  Error(`An error occurred while inserting solution answer status: ${err.message}`);
    }
  }


async function updateSolutionStatus(solution_id,body) {

    const { company_name, solution_ans_stat, pdf_path, comments, version_no, sol_stat_updated_by, sol_stat_updated_on, approved_by, approved_on, is_active } = body;

    const updateFields = [];
      const updateValues = [];

      if (company_name !== undefined) {
      updateFields.push('company_name = ?');
      updateValues.push(company_name);
      }

      if (solution_ans_stat !== undefined) {
      updateFields.push('solution_ans_stat = ?');
      updateValues.push(solution_ans_stat);
      }

      if (pdf_path !== undefined) {
      updateFields.push('pdf_path = ?');
      updateValues.push(pdf_path);
      }

      if (comments !== undefined) {
        updateFields.push('comments = ?');
        updateValues.push(comments);
        }

      if (is_active !== undefined) {
        updateFields.push('is_active = ?');
        updateValues.push(is_active);
      }

      if (approved_by !== undefined) {
        updateFields.push('approved_by = ?');
        updateValues.push(approved_by);
      }

      if (approved_on !== undefined) {
        updateFields.push('approved_on = ?');
        updateValues.push(approved_on);
      }

      if (version_no !== undefined) {
        updateFields.push('version_no = ?');
        updateValues.push(version_no);
      }
      //Push updated_by and updated_on fields
        updateFields.push('sol_stat_updated_by = ?, sol_stat_updated_on = ?');
        updateValues.push(sol_stat_updated_by, sol_stat_updated_on);
      
      if (updateFields.length === 0) {
        // No fields to update
        return{message: "Nothing to update"};
      }

    const sql =
    `UPDATE solution_answer_status SET ${updateFields.join(', ')} WHERE solution_id=` + solution_id;
    const updateParams = [...updateValues, solution_id];

    
    if(pdf_path != null) {
      await insertAuditTable(solution_id, pdf_path, sol_stat_updated_by, sol_stat_updated_on, is_active);
    }

    try {
      await db.query(sql, updateParams);
    // Fetch and return the updated data
    const [updatedRows] = await db.query('SELECT * FROM solution_answer_status WHERE solution_id = ?', [solution_id]);
    const updatedData = updatedRows[0];
    
    return {
      statusCode: 200,
      status: 'Success',
      message: 'Solution Answer Status updated successfully',
      data: updatedData,
    };
    } catch (err) {
      console.error(err.originalError); // Log the original error details
      throw new  Error(`An error occurred while updating solution answer status: ${err.message}`);
    }
  }


  async function insertAuditTable(solution_id, to_value, created_by, created_on, is_active) {

    //Below two lines of code is to collect previous answer
    const sql = "SELECT pdf_path FROM solution_answer_status WHERE solution_id = " + solution_id + " AND sol_stat_updated_by = " + created_by;
    const rows = await db.query(sql);
  
  
    const audit_sql = "INSERT INTO audit (solution_id, from_value, to_value, created_by, created_on, is_active) VALUES(?,?,?,?,?,?);";
    
    await db.query(audit_sql, [
      rows[0].solution_id, 
      rows[0].pdf_path, 
      to_value, 
      created_by, 
      created_on, 
      is_active
    ]);
  
  }

  //Return status of solution
  async function getSolutionStatus (solution_id)
  {
    const sql = 'SELECT * FROM solution_answer_status WHERE solution_id = ?';
    try {
      const status = await db.query(sql,[solution_id]);
      if(status.length == 0) {
        return null;
      }
      logger.info('Solution status retrieved successfully')
      return status;
    } catch (err) {
      console.error(err.originalError); // Log the original error details
      logger.error(`An error occurred while retrieving solution answer status: ${err.message}`)
      throw new  Error(`An error occurred while retrieving solution answer status: ${err.message}`);
    }
  }


  module.exports = {
    getSolutionStatus,
    insertSolution,
    updateSolution,
    insertSolutionStatus,
    updateSolutionStatus,
    getSolutions
  };