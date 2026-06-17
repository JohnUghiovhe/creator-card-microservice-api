const { createHandler } = require('@app-core/server');
const deleteCard = require('@app/services/creator-card-processor/delete-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'delete',
  middlewares: [],
  async handler(requestContext, helpers) {
    const parameterAggregationPayload = {
      slug: requestContext.params.slug,
      creator_reference: requestContext.body.creator_reference
    };

    const removalExecutionOutput = await deleteCard(parameterAggregationPayload, { db: global.db });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Creator Card Deleted Successfully.',
      data: removalExecutionOutput
    };
  }
});
