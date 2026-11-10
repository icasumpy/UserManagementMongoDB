const userService = require('../services/userService');

function handleError(error, response, next) {
  if (error instanceof userService.UserServiceError) {
    return response.status(error.status).json({ error: error.message });
  }
  return next(error);
}

async function listUsers(request, response, next) {
  try {
    const users = await userService.listUsers(typeof request.query.q === 'string' ? request.query.q : '');
    return response.status(200).json({ users });
  } catch (error) {
    return handleError(error, response, next);
  }
}

async function getUser(request, response, next) {
  try {
    const user = await userService.getUser(request.params.id);
    return response.status(200).json({ user });
  } catch (error) {
    return handleError(error, response, next);
  }
}

async function createUser(request, response, next) {
  try {
    const user = await userService.createUser(request.body);
    return response.status(201).json({ user });
  } catch (error) {
    return handleError(error, response, next);
  }
}

async function updateUser(request, response, next) {
  try {
    const user = await userService.updateUser(request.params.id, request.body);
    return response.status(200).json({ user });
  } catch (error) {
    return handleError(error, response, next);
  }
}

async function deleteUser(request, response, next) {
  try {
    const user = await userService.deleteUser(request.params.id);
    return response.status(200).json({ user });
  } catch (error) {
    return handleError(error, response, next);
  }
}

module.exports = { listUsers, getUser, createUser, updateUser, deleteUser };
