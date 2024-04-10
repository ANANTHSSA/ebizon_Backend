const questionsService = require("../services/questionService");

async function insertQuestion(req, res, next) {
    try {
      const questions = await questionsService.insertQuestion(req.body);
      if (questions != null)
          res.json(questions);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Please enter all records in proper format' });
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Question NOT inserted', error: err.message });
      next(err);
    }
  }

  async function updateQuestion(req, res, next) {
    try {
      const question_id = req.params.question_id;
      const questions = await questionsService.updateQuestion(question_id,req.body);
      res.json(questions);
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Question NOT updated' , error: err.message });
      next(err);
    }
}

async function deleteQuestion(req, res, next) {
  try {
    const question_id = req.params.question_id;
    const questions = await questionsService.deleteQuestion(question_id);
    res.json(questions);
  } catch (err) {
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Question NOT deleted', error: err.message});
    next(err);
  }
}

async function deleteQuestionExcel(req, res, next) {
  try {
    const question_id = req.params.question_id;
    const questions = await questionsService.deleteQuestionExcel(question_id);
    res.json(questions);
  } catch (err) {
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Question NOT deleted', error: err.message});
    next(err);
  }
}

async function getQuestions(req, res, next) {
  try{
    console.log("getQuestions called");
      const solution_id = req.query.solution_id;
      const category_id = req.query.category_id;
      const subCategory_id = req.query.subCategory_id;
      const questions = await questionsService.getQuestions(solution_id, category_id, subCategory_id);
      if (questions != null)
          res.json(questions);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Record not found for the given input' });
  }catch(err){
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Internal server error in retrieving questions', error: err.message});
    next(err);
  }
}

async function getQuestionsExcel(req, res, next) {
  try{
    console.log("getQuestions called");
      const solution_id = req.query.solution_id;
      const category_id = req.query.category_id;
      const subCategory_id = req.query.subCategory_id;
      const questions = await questionsService.getQuestionsExcel(solution_id, category_id, subCategory_id);
      if (questions != null)
          res.json(questions);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Record not found for the given input' });
  }catch(err){
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Internal server error in retrieving questions', error: err.message});
    next(err);
  }
}

async function processExcel(req, res, next) {
  try {
    solution_id = req.query.solution_id;
    category_id = req.query.category_id;
    const questions = await questionsService.processExcel(req.body, solution_id, category_id);
        res.json(questions);
  } catch (err) {
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Bulk insert failed', error: err.message });
    next(err);
  }
}

async function insertQuestionTemplate(req, res, next) {
  try {
    const questions = await questionsService.insertQuestionTemplate(req.body);
        res.json(questions);
  } catch (err) {
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Question and possible answers NOT inserted', error: err.message });
    next(err);
  }
}


async function updateQuestionTemplate(req, res, next) {
  try {
    const questions = await questionsService.updateQuestionTemplate(req.body);
        res.json(questions);
  } catch (err) {
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Question and possible answers NOT updated', error: err.message });
    next(err);
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
    getQuestionsExcel,
    deleteQuestionExcel
  };