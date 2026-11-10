function errorHandler(error, _request, response, _next) {
  if (error?.type === 'entity.too.large') {
    return response.status(413).json({ error: 'Request body exceeds the allowed size.' });
  }
  const errorName = typeof error?.name === 'string' ? error.name : 'Error';
  const errorType = typeof error?.type === 'string' ? ` (${error.type})` : '';
  const errorCode = Number.isInteger(error?.code) ? `, code=${error.code}` : '';
  const validationFields = errorName === 'ValidationError' && error?.errors
    ? `, fields=${Object.keys(error.errors).join(',')}`
    : '';
  const message = typeof error?.message === 'string' ? error.message : '';
  const safeCategory = error?.code === 11000 || error?.cause?.code === 11000
    ? 'duplicate-key'
    : /buffering timed out/i.test(message)
      ? 'database-buffer-timeout'
      : /validation/i.test(errorName)
        ? 'validation'
        : /connection|server selection/i.test(message)
          ? 'database-connection'
          : 'request';
  console.error(`[api] Request failed: ${errorName}${errorType}${errorCode}${validationFields}, category=${safeCategory}. Details omitted to protect request data and credentials.`);
  response.status(500).json({ error: 'Internal server error' });
}

module.exports = errorHandler;
