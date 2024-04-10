const db = require("./dbService");
const logger = require("../middlewares/logHandler.js");


async function insertCategory(body) {

  const { solution_id, cat_name, created_by, created_on } = body;
  //Check if the input received is valid before processing them
if(solution_id == undefined || cat_name == undefined || cat_name == "" || created_by == undefined || created_on == undefined) {
  logger.warn('Please enter all values - solution_id, cat_name, created_by, created_on and in their correct format')
  console.error("Please enter all values - solution_id, cat_name, created_by, created_on and in their correct format");
  return null;
}
  const sql =
    "INSERT INTO categories (solution_id, cat_name, created_by, created_on) VALUES (?,?,?,?);";
  

  try {
    await db.query(sql, [
      solution_id, 
      cat_name, 
      created_by, 
      created_on
    ]);
    const result = {};
      result.statusCode = 200;
      result.status = 'Success';
      result.message = 'Category inserted successfully';
      return result;
  } catch (err) {
    console.error(err.originalError); // Log the original error details
    throw new  Error(`An error occurred while inserting category: ${err.message}`);
  }
}
  

async function updateCategory(cat_id,body) {

  const { cat_name, updated_by, updated_on, is_active } = body;

  const updateFields = [];
      const updateValues = [];


      if (cat_name !== undefined) {
      updateFields.push('cat_name = ?');
      updateValues.push(cat_name);
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
  `UPDATE categories SET ${updateFields.join(', ')} WHERE cat_id=` + cat_id;
  const updateParams = [...updateValues, cat_id];

  try {
    await db.query(sql, updateParams);
    // Fetch and return the updated data
    const [updatedRows] = await db.query('SELECT * FROM categories WHERE cat_id = ?', [cat_id]);
    const updatedData = updatedRows[0];
    
    return {
      statusCode: 200,
      status: 'Success',
      message: 'Categories updated successfully',
      data: updatedData,
    };
  } catch (err) {
    console.error(err.originalError); // Log the original error details
    throw new  Error(`An error occurred while updating category: ${err.message}`);
  }
}

async function insertSubcategory(body) {

  const { cat_id, sub_cat_name, icon, image, file_attachment, created_by, created_on } = body;
  //Check if the input received is valid before processing them
if(cat_id == undefined || sub_cat_name == undefined || sub_cat_name == "" || icon == undefined || icon == "" || image == undefined || image == "" || file_attachment == undefined || file_attachment == "" || created_by == undefined || created_on == undefined) {
  logger.warn('Please enter all values - cat_id, sub_cat_name, icon, image, file_attachment, created_by, created_on and in their correct format')
  console.error("Please enter all values - cat_id, sub_cat_name, icon, image, file_attachment, created_by, created_on and in their correct format");
  return null;
}

  const sql =
    "INSERT INTO sub_category (cat_id, sub_cat_name, icon, image, file_attachment, created_by, created_on) VALUES (?,?,?,?,?,?,?)";

  try {
     await db.query(sql, [
      cat_id, 
      sub_cat_name, 
      icon, 
      image, 
      file_attachment, 
      created_by, 
      created_on
    ]);
    const result = {};
      result.statusCode = 200;
      result.status = 'Success';
      result.message = 'Sub Category inserted successfully';
      return result;
  } catch (err) {
    console.error(err.originalError); // Log the original error details
    throw new  Error(`An error occurred while inserting sub category: ${err.message}`);
  }
}
  

async function updateSubcategory(subCategory_id,body) {

  const { cat_id, sub_cat_name, icon, image, file_attachment, updated_by, updated_on, is_active } = body;

  const updateFields = [];
      const updateValues = [];

      if (cat_id !== undefined) {
      updateFields.push('cat_id = ?');
      updateValues.push(cat_id);
      }

      if (sub_cat_name !== undefined) {
      updateFields.push('sub_cat_name = ?');
      updateValues.push(sub_cat_name);
      }

      if (icon !== undefined) {
      updateFields.push('icon = ?');
      updateValues.push(icon);
      }

      if (image !== undefined) {
        updateFields.push('image = ?');
        updateValues.push(image);
        }

      if (file_attachment !== undefined) {
          updateFields.push('file_attachment = ?');
          updateValues.push(file_attachment);
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
  `UPDATE sub_category SET ${updateFields.join(', ')} WHERE sub_cat_id=` + subCategory_id;
  const updateParams = [...updateValues, subCategory_id];

  try {
    await db.query(sql, updateParams);
    // Fetch and return the updated data
    const [updatedRows] = await db.query('SELECT * FROM sub_category WHERE sub_cat_id = ?', [subCategory_id]);
    const updatedData = updatedRows[0];
    
    return {
      statusCode: 200,
      status: 'Success',
      message: 'Sub Category updated successfully',
      data: updatedData,
    };
  } catch (err) {
    console.error(err.originalError); // Log the original error details
    throw new  Error(`An error occurred while updating sub category: ${err.message}`);
  }
}

async function getSubcategories(category_id) {
  try{
    const sql = 'SELECT * FROM sub_category WHERE cat_id =' + category_id + ' order by cat_id, order_id';
    const rows = await db.query(sql);

    logger.info(`Retrieved sub category details sucessfully`);

    return(rows);
  } catch (err) {
    logger.error(`An error occurred while retrieving sub category details: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new  Error(`An error occurred while retrieving sub category details: ${err.message}`);
  }
}


async function getCategories(solution_id) {
  try{
    const sql = 'SELECT * FROM categories WHERE solution_id =' + solution_id + ' order by solution_id, order_id';
    const rows = await db.query(sql);
    logger.info(`Category details retrieved successfully`);

    return(rows);
  } catch (err) {
    logger.error(`An error occurred while retrieving category details: ${err.message}`);
    console.error(err.originalError); // Log the original error details
    throw new  Error(`An error occurred while retrieving category details: ${err.message}`);
  }
}


async function insertCatAnsStatus(body) {

  const { solution_id, cat_id, category_ans_stat, created_by, created_on } = body;

  //Check if the input received is valid before processing them
if(solution_id == undefined || cat_id == undefined || category_ans_stat == undefined || category_ans_stat == "" || created_by == undefined || created_on == undefined) {
  logger.warn('Please enter all values - solution_id, cat_id, category_ans_stat, created_by, created_on and in their correct format')
  console.error("Please enter all values - solution_id, cat_id, category_ans_stat, created_by, created_on and in their correct format");
  return null;
}

    const sql =
      "INSERT INTO category_answer_status (solution_id, cat_id, category_ans_stat, created_by, created_on) VALUES (?,?,?,?,?);";
  
    try {
      await db.query(sql, [ 
        solution_id, 
        cat_id, 
        category_ans_stat, 
        created_by, 
        created_on
      ]);
      const result = {};
      result.statusCode = 200;
      result.status = 'Success';
      result.message = 'Category answer status inserted successfully';
      return result;
    } catch (err) {
      console.error(err.originalError); // Log the original error details
      throw new  Error(`An error occurred while inserting category answer status: ${err.message}`);
    }
  }
  async function lockORUnlockCategory(category_id,body) {
    try
    {
    const{lockType, updated_by, updated_on } = body;
    // const sql_check = 'SELECT * FROM categories WHERE cat_id = ' + category_id;
    // const rows_check = await db.query(sql_check);

    //   if(rows_check[0].is_locked == lockType) {
    //     if (lockType == true) {
    //           return {
    //   statusCode: 200,
    //   status: 'Success',
    //   message: 'Category already locked',
    // };
    //     } else {
    //           return {
    //   statusCode: 200,
    //   status: 'Success',
    //   message: 'Category already unlocked',
    // };
    //     }
    //   }
    const updateFields = [];
    const updateValues = [];
    updateFields.push('is_locked = ?,updated_by = ?, updated_on = ?');
    updateValues.push(lockType,updated_by, updated_on);
    const sql =
    `UPDATE categories SET ${updateFields.join(', ')} WHERE cat_id=` + category_id;
    const updateParams = [...updateValues, category_id];
    await db.query(sql, updateParams);
      // Fetch and return the updated data
    const updatedRows = await db.query('SELECT * FROM categories WHERE cat_id = ?', [category_id]);
    const updatedData = updatedRows[0];
    logger.info(`Category locked/unlocked successfully`);

    // return {
    //   statusCode: 200,
    //   status: 'Success',
    //   message: 'Category locked/unlocked successfully',
    //   data: updatedData,
    // };
    if(updatedData.is_locked === 0) {
          return {
      statusCode: 200,
      status: 'Success',
      message: 'Category unlocked successfully',
      data: updatedData,
    }
    } else {
      return {
        statusCode: 200,
        status: 'Success',
        message: 'Category locked successfully',
        data: updatedData,
      };
    }
    } catch (err) {
      logger.error(`An error occurred while locking/unlocking category: ${err.message}`);
      console.error(err.originalError); // Log the original error details
      throw new  Error(`An error occurred while locking/unlocking category: ${err.message}`);
    }
  }

  async function bulklockORUnlockCategory(solution_id,body) {
    try
    {
    const{lockType, updated_by, updated_on } = body;
    //Checking if all categories are locked already
    const sql_check = `SELECT CASE WHEN COUNT(*) > 0 AND COUNT(*) = SUM(is_locked) THEN true
   ELSE false END AS lock_check FROM categories WHERE solution_id = ` + solution_id;;
  
    const rows_check = await db.query(sql_check);
    if(rows_check[0].lock_check == 1 && lockType == 1) {
      console.log("line 325")
      return {
        statusCode: 200,
        status: 'Success',
        message: 'All categories already locked',
      };
    }

    //Checking if all categories are unlocked already
    const sql_count = 'SELECT CASE WHEN COUNT(*) > 0 AND SUM(CASE WHEN is_locked = 0 THEN 1 ELSE 0 END) = COUNT(*) THEN true ELSE false END AS lock_check FROM categories WHERE solution_id = ' + solution_id;
    const rows_count = await db.query(sql_count)
;
if(rows_count[0].lock_check == 1 && lockType == 0) {
  console.log("in line 337")
  return {
    statusCode: 200,
    status: 'Success',
    message: 'All categories already unlocked',
  };
}

    const updateFields = [];
    const updateValues = [];
    updateFields.push('is_locked = ?,updated_by = ?, updated_on = ?');
    updateValues.push(lockType,updated_by, updated_on);
    const sql =
    `UPDATE categories SET ${updateFields.join(', ')} WHERE solution_id=` + solution_id;
    const updateParams = [...updateValues, solution_id];
    await db.query(sql, updateParams);
      // Fetch and return the updated data
    const updatedRows = await db.query('SELECT * FROM categories WHERE solution_id = ?', [solution_id]);
    const updatedData = updatedRows[0];
    
    logger.info(`Category bulk locked/unlocked successfully`);
      
    // return {
    //   statusCode: 200,
    //   status: 'Success',
    //   message: 'Category bulk locked/unlocked successfully',
    //   data: updatedData,
    // };
    if(lockType == 0) {
      console.log("line 367")
      return {
  statusCode: 200,
  status: 'Success',
  message: 'Category unlocked successfully',
  data: updatedData,
}
} else {
  console.log("line 375")
  return {
    statusCode: 200,
    status: 'Success',
    message: 'Category locked successfully',
    data: updatedData,
  };
}
    } catch (err) {
      logger.error(`An error occurred while bulk locking/unlocking category: ${err.message}`);
      console.error(err.originalError); // Log the original error details
      throw new  Error(`An error occurred while bulk locking/unlocking category: ${err.message}`);
    }
  }

async function updateCatAnsStatus(category_id,body) {

    const {category_ans_stat, updated_by, updated_on, is_active } = body;

    const updateFields = [];
    const updateValues = [];

      if (category_ans_stat !== undefined) {
      updateFields.push('category_ans_stat = ?');
      updateValues.push(category_ans_stat);
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
    `UPDATE category_answer_status SET ${updateFields.join(', ')} WHERE cat_id=` + category_id;
    const updateParams = [...updateValues, category_id];

    try {
      await db.query(sql, updateParams);
      // Fetch and return the updated data
    const [updatedRows] = await db.query('SELECT * FROM category_answer_status WHERE cat_id = ?', [category_id]);
    const updatedData = updatedRows[0];
    
    return {
      statusCode: 200,
      status: 'Success',
      message: 'Category Answer Status updated successfully',
      data: updatedData,
    };
    } catch (err) {
      console.error(err.originalError); // Log the original error details
      throw new  Error(`An error occurred while updating category answer status: ${err.message}`);
    }
  }




module.exports = {
  insertCategory,
  updateCategory,
  getCategories,
  insertCatAnsStatus,
  updateCatAnsStatus,
  insertSubcategory,
  updateSubcategory,
  getSubcategories,
  lockORUnlockCategory,
  bulklockORUnlockCategory
};
