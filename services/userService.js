//Get DB Objects from Controller and do the business logic then connect with Database. Finally return the user result object
//Define all CURD operations for User
const db = require("./dbService");
const logger = require("../middlewares/logHandler.js");



//Api for registration process as well as insertion in user_solutions table
// async function insertUser(body) {
//   try {
//   const sql =
//     "INSERT INTO users (user_name, role_id, passwd, email_id, company_name, phone_num, created_by, created_on) VALUES (?,?,?,?,?,?,?,?);";
//   const { user_name, role_id, passwd, email_id, company_name, phone_num, created_by, created_on, solution_id } = body;  
  
//     await db.query(sql, [
//       user_name,
//       role_id, 
//       passwd, 
//       email_id, 
//       company_name, 
//       phone_num, 
//       created_by, 
//       created_on
//     ]);

//     //Adding single quotes to avoid syntax error
//     const replacedUserName = `'${user_name}'`;
//     console.log(replacedUserName)
//     const sql_user_id = 'SELECT user_id FROM users WHERE user_name = ' + replacedUserName;
//     const user_id = await db.query(sql_user_id);

//     const sql_mapping = 'INSERT INTO user_solutions (user_id, solution_id, created_by, created_on) VALUES(?,?,?,?)';

//     for (i=0; i<solution_id.length; i++) {
//     await db.query(sql_mapping, [
//       user_id[0].user_id,
//       solution_id[i],
//       created_by, 
//       created_on
//     ])
//   }

//   } catch (error) {
//     console.error("Error inserting data:", error);
//     throw new Error("An error occurred while inserting data in users table");
//   }

// }

async function insertUser(body) {
  
  const { user_name, role_id, passwd, email_id, company_name, phone_num, created_by, created_on} = body;  

  //Check if the input received is valid before processing them
if(user_name == undefined || user_name == "" || passwd == undefined || passwd == "" || email_id == undefined || email_id == "" || company_name == undefined || company_name == "" || created_by == undefined || created_on == undefined) {
  console.error("Please enter all values - user_name, passwd, email_id, company_name, created_by, created_on and in their correct format");
  logger.warn(`Please enter all values - user_name, passwd, email_id, company_name, created_by, created_on and in their correct format`);
  return null;
}
//check if email_id already registered
try{
const rows_email = await db.query('SELECT * FROM users WHERE email_id = ?',[email_id]);


if(rows_email.length > 0) {
  logger.warn(`User already registered`);
  const result = {};
  result.statusCode = 500;
  result.status = 'Failure';
  result.message = 'User already registered';
  return result;
}
  const sql =
    "INSERT INTO users (user_name, passwd, email_id, company_name, phone_num, created_by, created_on) VALUES (?,?,?,?,?,?,?);";
  

    await db.query(sql, [
      user_name, 
      passwd, 
      email_id, 
      company_name, 
      phone_num, 
      created_by, 
      created_on
    ]);
    logger.info(`User registration successful`);
    const result = {};
    result.statusCode = 200;
    result.status = 'Success';
    result.message = 'User registration successful';
    return result;
  } catch (err) {
    logger.error(`An error occurred while inserting user details: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new  Error(`An error occurred while inserting user details: ${err.message}`);
  }

}

async function getUsers(user_id=null)
{
  try{

// let sql = 'SELECT u.user_id, u.user_name, u.role_id, u.passwd, u.email_id, u.company_name, u.phone_num, u.created_by, u.created_on, u.updated_by, u.updated_on, u.is_active, u.is_delete, us.solution_id, s.solution_name FROM users u LEFT JOIN (SELECT user_id, solution_id, MAX(is_active) as is_active FROM user_solutions GROUP BY user_id, solution_id) us ON u.user_id = us.user_id AND us.is_active = 1 LEFT JOIN solutions s ON s.solution_id = us.solution_id WHERE u.is_delete = 0 AND u.role_id != 1 '

let sql = 'SELECT u.user_id, u.user_name, u.role_id, u.passwd, u.email_id, u.company_name, u.phone_num, u.created_by, u.created_on, u.updated_by, u.updated_on, u.is_active, u.is_delete, us.solution_id, s.solution_name FROM users u LEFT JOIN (SELECT user_id, solution_id, MAX(is_active) as is_active FROM user_solutions GROUP BY user_id, solution_id) us ON u.user_id = us.user_id AND us.is_active = 1 LEFT JOIN solutions s ON s.solution_id = us.solution_id WHERE u.is_delete = 0'

    let params = [];
    if (user_id!=null)
   {
       sql +=' AND u.user_id = ? ORDER BY role_id'
      params = [user_id];
  } else 
    sql += ' ORDER BY role_id'
  
    const rows = await db.query(sql,params);

    const groupedOutput = rows.reduce((acc, obj) => {
      const existingUser = acc.find(user => user.user_id === obj.user_id && user.user_name === obj.user_name);

      if (existingUser) {
        if (!existingUser.solutions) {
          existingUser.solutions = [];
        }
        existingUser.solutions.push({
          solution_id: obj.solution_id,
          solution_name: obj.solution_name
        });
      } else {
        acc.push({
          user_id: obj.user_id,
          user_name: obj.user_name,
          role_id: obj.role_id,
          passwd: obj.passwd,
          email_id: obj.email_id,
          company_name: obj.company_name,
          phone_num: obj.phone_num,
          is_active: obj.is_active,
          is_delete: obj.is_delete,
          solutions: [{
            solution_id: obj.solution_id,
            solution_name: obj.solution_name
          }]
        });
      }
    
      return acc;
    }, []);
    logger.info('User details fetched successfully')
    return groupedOutput;
  } catch (err) {
    logger.error(`An error occurred while fetching user details: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new  Error(`An error occurred while fetching user details: ${err.message}`);
  }
}


async function updateUser(user_id,body) {
  
  const { user_name, role_id, passwd, email_id, company_name, phone_num, created_on, updated_by, updated_on,is_active,is_delete} = body;
  
  const updateFields = [];
  const updateValues = [];

      if (user_name !== undefined) {
      updateFields.push('user_name = ?');
      updateValues.push(user_name);
      }

      if (role_id !== undefined) {
      updateFields.push('role_id = ?');
      updateValues.push(role_id);
      }

      if (passwd !== undefined) {
      updateFields.push('passwd = ?');
      updateValues.push(passwd);
      }

      if (email_id !== undefined) {
        updateFields.push('email_id = ?');
        updateValues.push(email_id);
      }

      if (company_name !== undefined) {
        updateFields.push('company_name = ?');
        updateValues.push(company_name);
      }

      if (phone_num !== undefined) {
        updateFields.push('phone_num = ?');
        updateValues.push(phone_num);
      }

      if (is_active !== undefined) {
        updateFields.push('is_active = ?');
        updateValues.push(is_active);
      }
      if (is_delete !== undefined) {
        updateFields.push('is_delete = ?');
        updateValues.push(is_delete);
      }
      if (created_on !== undefined) {
        updateFields.push('created_on = ?');
        updateValues.push(created_on);
      }


      //Push updated_by and updated_on fields
        updateFields.push('updated_by = ?, updated_on = ?');
        updateValues.push(updated_by, updated_on);
      
      if (updateFields.length === 0) {
        // No fields to update
        return{message: "Nothing to update"};
      }

  const sql =
  `UPDATE users SET ${updateFields.join(', ')} WHERE user_id=` + user_id;
  const updateParams = [...updateValues, user_id];
  try {
    await db.query(sql, updateParams);
    // Fetch and return the updated data
    const [updatedRows] = await db.query('SELECT * FROM users WHERE user_id = ?', [user_id]);
    const updatedData = updatedRows[0];
    logger.info('User details updated successfully')
    return {
      statusCode: 200,
      status: 'Success',
      message: 'User details updated successfully',
      data: updatedData,
    };
  } catch (err) {
    logger.error(`An error occurred while updating user details: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new  Error(`An error occurred while updating user details: ${err.message}`);
  }
}


async function deleteUser(user_id) {   
  const sql =
  "UPDATE users SET is_delete = TRUE WHERE user_id=" + user_id;
  try {
    const rows = await db.query(sql);
    if(rows.affectedRows >= 1) { 
      const result = {};
      logger.info(`User ${user_id} deleted succesfully`)
      result.statusCode = 200;
      result.status = 'Success';
      result.message = 'User deleted successfully';
      return result;
      } else {
        logger.warn('Record not found')
        const result = {};
        result.statusCode = 500;
        result.status = 'Failure';
        result.message = 'Record not found';
        return result;  
      }
  } catch (err) {
    logger.error(`An error occurred while deleting user: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new  Error(`An error occurred while deleting user: ${err.message}`);
  }
}

async function deactivateUser(user_id) {
  
  const sql =
  "UPDATE users SET is_active = FALSE WHERE user_id=" + user_id;
  try {
    const rows = await db.query(sql);
    if(rows.affectedRows >= 1) { 
      logger.info(`User ${user_id} deactivated successfully`)
      const result = {};
      result.statusCode = 200;
      result.status = 'Success';
      result.message = 'User deactivated successfully';
      return result;
      } else {
        logger.warn('Record not found')
        const result = {};
        result.statusCode = 500;
        result.status = 'Failure';
        result.message = 'Record not found';
        return result;  
      }
  } catch (err) {
    logger.error(`An error occurred while deactivating user: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new  Error(`An error occurred while deactivating user: ${err.message}`);
  }
}

async function userAccess(body) {

    const {user_id, solution_id, role_id, created_by, created_on, updated_by, updated_on} = body;
    if(user_id == null) return null;
    try {
    if(role_id != null) {
      const sql_role_update = 'UPDATE users SET role_id = ?, updated_by = ?, updated_on = ? WHERE user_id = ' + user_id;
      await db.query(sql_role_update, [role_id, updated_by, updated_on]);
    }
    logger.info('Role updated successfully')
  } catch (err) {
    logger.error(`An error occurred while updating role_id durin user access: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new  Error(`An error occurred while updating role_id durin user access: ${err.message}`);
  }
  try{
    if(solution_id != null) {
      let existingSolutions = await db.query(
        'SELECT solution_id FROM user_solutions WHERE user_id = ? AND is_active = 1',
        [user_id]
      );
  
      // Identify solutions to activate (in the input array but not currently active)
      const solutionsToActivate = solution_id.filter(id => !existingSolutions.some(row => row.solution_id === id));
  
      // Activate new solutions
      if (solutionsToActivate.length > 0) {
        await db.query(
          'UPDATE user_solutions SET is_active = 1, updated_by = ?, updated_on = ? WHERE user_id = ? AND solution_id IN (?)',
          [updated_by, updated_on, user_id, solutionsToActivate]
        );
      }
  
      // Identify solutions to deactivate (currently active but not in the input array)
      const solutionsToDeactivate = existingSolutions.filter(row => !solution_id.includes(row.solution_id));
      if (solutionsToDeactivate.length > 0) {
        await db.query(
          'UPDATE user_solutions SET is_active = 0, updated_by = ?, updated_on = ? WHERE user_id = ? AND solution_id IN (?)',
          [updated_by, updated_on, user_id, solutionsToDeactivate.map(row => row.solution_id)]
        );
      }
  
      existingSolutions = await db.query(
        'SELECT solution_id FROM user_solutions WHERE user_id = ? AND is_active = 1',
        [user_id]
      );

      //Identify solutions to insert (in the input array but not currently active or in the table)
      const solutionsToInsert = solution_id.filter(
        id => !existingSolutions.some(row => row.solution_id === id)
      );

      // Insert new solutions
      if (solutionsToInsert.length > 0) {
        const insertValues = solutionsToInsert.map(id => [user_id, id, created_by, created_on, 1]);
        await db.query('INSERT INTO user_solutions (user_id, solution_id, created_by, created_on, is_active) VALUES ?', [insertValues]);
      }
  
  }
  logger.info('Solutions updated successfully in user access')
  } catch (err) {
    logger.error(`An error while updating solutions during User Access: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new  Error(`An error while updating during User Access: ${err.message}`);
  }
  const result = {};
        result.statusCode = 200;
        result.status = 'Success';
        result.message = 'User Access updated successfully';
  
  return result;
  }

  //Currently not using this api, need modifications. Logic same as user access
async function updateUserSolutionMapping(user_id, body) {
  
  const {solution_id, updated_by, updated_on, is_active} = body;
  
  const updateFields = [];
  const updateValues = [];

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

  const sql_check = 'SELECT solution_id FROM user_solutions WHERE user_id = ' + user_id;
  const sql =
  `UPDATE user_solution SET ${updateFields.join(', ')} WHERE user_id=` + user_id;
  const updateParams = [...updateValues, user_id];
  try {
    const rows_check = await db.query(sql_check);
    let solutionid_Array = []
    for(i=0; i < solution_id.length; i++) {
    if(rows_check.some(item => item.solution_id === solution_id[i])) {
      solutionid_Array = solution_id[i];
      console.log (solutionid_Array)
    } }
    // await db.query(sql, updateParams);
    // // Fetch and return the updated data
    // const [updatedRows] = await db.query('SELECT * FROM users WHERE user_id = ?', [user_id]);
    // const updatedData = updatedRows[0];
    
    // return {
    //   statusCode: 200,
    //   status: 'Success',
    //   message: 'User Solution mapping updated successfully',
    //   data: updatedData,
    // };
  } catch (err) {
    console.error(err.originalError); // Log the original error details
    throw new  Error(`An error occurred while updating user solution mapping: ${err.message}`);
  }
}

// async function updateLogoutTime(user_id, body) {

//   console.log("updateLogoutTime called")
//   const {logout_time } = body;
//   if(user_id == null || logout_time == null) {
//     logger.warn("Please enter user_id and logout time")
//     return null;
//   }
//   const sql_logout = 'UPDATE session_management SET logout_time = ? WHERE user_id = ? AND logout_time IS NULL';
//   try {
//   await db.query(sql_logout,[logout_time,user_id]);
//   } catch(err) {
//     console.error(err.originalError); // Log the original error details
//     throw new  Error(`An error occurred while adding logout time: ${err.message}`);
//   }
//   logger.info("LOGOUT time added successfully")
//   const result = {};
//   result.statusCode = 200;
//   result.status = 'Success';
//   result.message = 'LOGOUT time added successfully';

// return result;
// }

module.exports = {
  insertUser,
  updateUser,
  deleteUser,
  deactivateUser,
  updateUserSolutionMapping,
  getUsers,
  userAccess,
  //updateLogoutTime
};
