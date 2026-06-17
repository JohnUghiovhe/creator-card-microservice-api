const { createHandler } = require('@app-core/server');
const createCard = require('@app/services/creator-card-processor/create-card');

module.exports = createHandler({
  path: '/creator-cards',
  method: 'post',
  middlewares: [],
  async handler(requestContext, helpers) {
    const executionOutput = await createCard(requestContext.body, { db: global.db });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Creator Card Created Successfully.',
      data: executionOutput
    };
  }
});
