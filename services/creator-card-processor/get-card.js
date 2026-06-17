const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors'); // Imported ERROR_CODE
const { appLogger } = require('@app-core/logger');
const { getDatabaseConnection } = require('@app-core/mongoose');
const CreatorCardMessages = require('@app/messages/creator-card');

const spec = `root {
  slug string<trim>
  access_code? string<trim>
}`;
const parsedSpec = validator.parse(spec);

async function getCard(serviceData, options = {}) {
  let response;
  const data = validator.validate(serviceData, parsedSpec);

  try {
    const databaseInstance = options.db || getDatabaseConnection();
    const documentRecord = await databaseInstance.collection('creator_cards').findOne({ slug: data.slug, deleted: null });

    // Gate Rule 1: Validate physical system existence (NF01)
    if (!documentRecord) {
      throwAppError(CreatorCardMessages.CARD_NOT_FOUND, ERROR_CODE.NF01);
    }

    // Gate Rule 2: Intercept un-published profile variants (NF02)
    if (documentRecord.status === 'draft') {
      throwAppError(CreatorCardMessages.CARD_IS_DRAFT, ERROR_CODE.NF02);
    }

    // Gate Rule 3 & 4: Evaluate credentials on private profiles (AC03 & AC04)
    if (documentRecord.access_type === 'private') {
      if (!data.access_code) {
        throwAppError(CreatorCardMessages.ACCESS_CODE_MISSING, ERROR_CODE.AC03);
      }
      if (documentRecord.access_code !== data.access_code) {
        throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE, ERROR_CODE.AC04);
      }
    }

    // Gate Rule 5: Map response objects while omitting credential tracking properties
    response = {
      id: documentRecord._id,
      title: documentRecord.title,
      description: documentRecord.description,
      slug: documentRecord.slug,
      creator_reference: documentRecord.creator_reference,
      links: documentRecord.links,
      service_rates: documentRecord.service_rates,
      status: documentRecord.status,
      access_type: documentRecord.access_type,
      created: documentRecord.created,
      updated: documentRecord.updated,
      deleted: documentRecord.deleted
    };

  } catch (error) {
    appLogger.errorX(error, 'service-get-card-execution-failure');
    throw error;
  }

  return response;
}

module.exports = getCard;
