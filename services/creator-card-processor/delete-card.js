const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const { getDatabaseConnection } = require('@app-core/mongoose');
const CreatorCardMessages = require('@app/messages/creator-card');

const spec = `root {
  slug string<trim>
  creator_reference string<trim|length:20>
}`;
const parsedSpec = validator.parse(spec);

async function deleteCard(serviceData, options = {}) {
  let response;
  
  // Step 1: Input Validation First
  const data = validator.validate(serviceData, parsedSpec);

  try {
    const databaseInstance = options.db || getDatabaseConnection();
    
    // Check for the card and ensure it hasn't been deleted already
    const recordLookup = await databaseInstance.collection('creator_cards').findOne({ 
      slug: data.slug, 
      deleted: null 
    });

    // Rule: If no card with that slug exists → HTTP 404, error code NF01
    if (!recordLookup) {
      throwAppError(CreatorCardMessages.CARD_NOT_FOUND, ERROR_CODE.NF01);
    }

    const standardDeletionTimestamp = Date.now();
    
    // Soft deletion update step
    await databaseInstance.collection('creator_cards').updateOne(
      { _id: recordLookup._id },
      { $set: { deleted: standardDeletionTimestamp, updated: standardDeletionTimestamp } }
    );

    // Step 2: Map response structure (exposing id, retaining access_code context)
    response = {
      id: recordLookup._id,
      title: recordLookup.title,
      description: recordLookup.description,
      slug: recordLookup.slug,
      creator_reference: recordLookup.creator_reference,
      links: recordLookup.links,
      service_rates: recordLookup.service_rates,
      status: recordLookup.status,
      access_type: recordLookup.access_type,
      access_code: recordLookup.access_code,
      created: recordLookup.created,
      updated: standardDeletionTimestamp,
      deleted: standardDeletionTimestamp
    };

  } catch (error) {
    appLogger.errorX(error, 'service-delete-card-execution-failure');
    throw error;
  }

  // Step 3: Single Exit Point
  return response;
}

module.exports = deleteCard;
