const solutionService = require("../services/solutionService");


async function insertSolution(req, res, next) {
  try {
    const solstatus = await solutionService.insertSolution(req.body);
    if (solstatus != null)
          res.json(solstatus);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Please enter all records in proper format' });
  } catch (err) {
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Solution NOT inserted' });
    next(err);
  }
}


async function updateSolution(req, res, next) {
  try {
    const solution_id = req.params.solution_id;
    const solstatus = await solutionService.updateSolution(solution_id,req.body);
    res.json(solstatus);
  } catch (err) {
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Solution NOT updated' });
    next(err);
  }
}

async function getSolutions(req, res, next) {
  try {
    console.log("getsolutions called");
    const user_id=req.query.user_id
    const role_id=req.query.role_id
    const solution_page=req.query.solution_page
    const solstatus = await solutionService.getSolutions(user_id, role_id, solution_page);
    if (solstatus != null)
          res.json(solstatus);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Record not found for the given input' });
  } catch (err) {
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Get Solution failed' });
    next(err);
  }
}


async function insertSolutionStatus(req, res, next) {
    try {
      const solstatus = await solutionService.insertSolutionStatus(req.body);
      if (solstatus != null)
          res.json(solstatus);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Please enter all records in proper format' });
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Solution Answer Status NOT inserted' });
      next(err);
    }
}

  async function updateSolutionStatus(req, res, next) {
    try {
      console.log("updateSolutionStatus called");
      const solution_id=req.params.solution_id;
      const solstatus = await solutionService.updateSolutionStatus(solution_id,req.body);
      res.json(solstatus);
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Solution Answer Status NOT updated' });
      next(err);
    }
  }

  async function getSolutionStatus (req, res, next) {
    try {
      console.log("updateSolutionStatus called");
      const solution_id=req.query.solution_id;
      const solstatus = await solutionService.getSolutionStatus(solution_id);
      if(solstatus != null) {
      res.json(solstatus);
      } else {
        res.status(500).json({ statusCode: 500, status: 'Failure', message: 'No record for the given input' });
      }
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Solution Answer Status NOT updated' });
      next(err);
    }
  }

  module.exports = {
    insertSolution,
    updateSolution,
    insertSolutionStatus,
    updateSolutionStatus,
    getSolutions,
    getSolutionStatus
  };