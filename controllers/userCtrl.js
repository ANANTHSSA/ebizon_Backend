const userService = require("../services/userService");

async function insertUser(req, res, next) {
    try {
      const users = await userService.insertUser(req.body);
      if (users != null)
          res.json(users);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Please enter all records in proper format' });
    } catch (err) {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'User details NOT registered' });
      next(err);
    }
  }
  

async function updateUser(req, res, next) {
  try {
    const user_id=req.params.user_id;
    const users = await userService.updateUser(user_id,req.body);
    res.json(users);
  } catch (err) {
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'User details NOT updated' });
    next(err);
  }
}

async function getUsers(req, res, next) {
  try {
    const user_id=req.query.user_id;
    const users = await userService.getUsers(user_id);
    if (users != null)
          res.json(users);
        else
          res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Record not found for the given input' });
  } catch (err) {
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'User details NOT retrieved' });
    next(err);
  }
}



async function deleteUser(req, res, next) {
  try {
    const user_id=req.params.user_id;
    const users = await userService.deleteUser(user_id);
    res.json(users);
  } catch (err) {
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'User NOT deleted' });
    next(err);
  }
}

async function deactivateUser(req, res, next) {
  try {
    const user_id=req.params.user_id;
    const users = await userService.deactivateUser(user_id);
    res.json(users);
  } catch (err) {
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'User NOT deactivated' });
    next(err);
  }
}


async function updateUserSolutionMapping(req, res, next) {
  try {
    const user_id=req.params.user_id;
    const users = await userService.updateUserSolutionMapping(user_id, req.body);
    res.json(users);
  } catch (err) {
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'User Solution Mapping NOT updated' });
    next(err);
  }
}

async function userAccess(req, res, next) {
  try {
    const users = await userService.userAccess(req.body);
    if(users != null) {
        res.json(users);
    } else {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Please enter user_id for User Access' });
    }
  } catch (err) {
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'User solution details NOT inserted/updated' });
    next(err);
  }
}

async function updateLogoutTime(req, res, next) {
  try {
    const user_id=req.params.user_id;
    const users = await userService.updateLogoutTime(user_id, req.body);
    if(users != null) {
    res.json(users);
    } else {
      res.status(500).json({ statusCode: 500, status: 'Failure', message: 'Please enter user_id for User Access' });
    }
  } catch (err) {
    res.status(500).json({ statusCode: 500, status: 'Failure', message: 'User Solution Mapping NOT updated' });
    next(err);
  }
}


module.exports = {
    insertUser,
    getUsers,
    updateUser,
    deleteUser,
    deactivateUser,
    updateUserSolutionMapping,
    userAccess,
    updateLogoutTime
};