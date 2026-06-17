const express = require('express');
const cors = require('cors');
const { appLogger } = require('@app-core/logger');

const http_statuses = {
  HTTP_200_OK: 200,
  HTTP_201_CREATED: 201,
  HTTP_400_BAD_REQUEST: 400,
  HTTP_403_FORBIDDEN: 403,
  HTTP_404_NOT_FOUND: 404,
  HTTP_500_INTERNAL_SERVER_ERROR: 500
};

function createHandler(config) {
  // Returns standard configuration metadata back to the route auto-loader engine
  return {
    path: config.path,
    method: config.method,
    handler: config.handler
  };
}

module.exports = {
  createHandler,
  http_statuses
};
