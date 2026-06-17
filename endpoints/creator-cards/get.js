const { createHandler } = require('@app-core/server');
const getCard = require('@app/services/creator-card-processor/get-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'get',
  middlewares: [],
  async handler(requestContext, helpers) {
    const normalizedInputPayload = {
      slug: requestContext.params.slug,
      access_code: requestContext.query.access_code
    };

    const extractionResult = await getCard(normalizedInputPayload, { db: global.db });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Creator Card Retrieved Successfully.',
      data: extractionResult
    };
  }
});
