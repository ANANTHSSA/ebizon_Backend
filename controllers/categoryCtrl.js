const catService = require("../services/categoryService");

async function insertCategory(req, res, next) {
    try{
        const categories = await catService.insertCategory(req.body);
        if (categories != null)
          res.json(categories);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Please enter all records in proper format' });
    }catch(err){
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Category NOT inserted' });
        next(err);
    }
}


async function updateCategory(req, res, next) {
    try {
      const cat_id = req.params.cat_id;
      const categories = await catService.updateCategory(cat_id,req.body);
      res.json(categories);
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Category NOT updated' });
      next(err);
    }
}

async function insertSubcategory(req, res, next) {
  try{
      const categories = await catService.insertSubcategory(req.body);
      if (categories != null)
          res.json(categories);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Please enter all records in proper format' });
  }catch(err){
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Sub Category NOT inserted' });
      next(err);
  }
}


async function updateSubcategory(req, res, next) {
  try {
    const subCategory_id=req.params.subCategory_id;
    const categories = await catService.updateSubcategory(subCategory_id, req.body);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Sub Category NOT updated' });
    next(err);
  }
}


async function getSubcategories(req, res, next) {
  try {
    console.log("getSubCategories called");
    const category_id = req.query.category_id;
    const subCategories = await catService. getSubcategories(category_id);
    if (subCategories != null)
          res.json(subCategories);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Record not found for the given input' });
  } catch (err) {
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Error in reading data' });
    next(err);
  }
}


async function getCategories(req, res, next) {
  try{
    console.log("getCategories called");
    const solution_id = req.query.solution_id;
      const categories = await catService.getCategories(solution_id);
      if (categories != null)
          res.json(categories);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Record not found for the given input' });
  }catch(err){
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Error in reading data' });
      next(err);
  }
}



async function insertCatAnsStatus(req, res, next) {
    try {
      const categories = await catService.insertCatAnsStatus(req.body);
      if (categories != null)
          res.json(categories);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Please enter all records in proper format' });
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Category Answer Status NOT inserted' })
      next(err);
    }
}

async function lockORUnlockCategory(req, res, next) {
  try {
    const category_id = req.params.category_id; 
    const categories = await catService.lockORUnlockCategory(category_id,req.body)
    if (categories != null)
          res.json(categories);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Please enter all records in proper format' });
  } catch (err) {
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Category not locked/unlocked' });
    next(err);
  }
}

async function bulklockORUnlockCategory(req, res, next) {
  try {
    const solution_id = req.params.solution_id; 
    const categories = await catService.bulklockORUnlockCategory(solution_id,req.body)
    if (categories != null)
    res.json(categories);
  else
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Please enter all records in proper format' });
  } catch (err) {
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Bulk lock/unlock not done' });
    next(err);
  }
}

async function updateCatAnsStatus(req, res, next) {
    try {
      const category_id = req.params.category_id;
      const categories = await catService.updateCatAnsStatus(category_id,req.body);
      res.json(categories);
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Category Answer Status NOT updated' });
      next(err);
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
}