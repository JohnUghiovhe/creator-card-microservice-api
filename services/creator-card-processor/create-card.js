const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const { getDatabaseConnection } = require('@app-core/mongoose');
const { ulid } = require('@app-core/randomness');
const CreatorCardMessages = require('@app/messages/creator-card');

// Step 1: VSL Specification Mapping
const spec = `root {
  title string<trim|minLength:3|maxLength:100>
  description? string<trim|maxLength:500>
  slug? string<trim|minLength:5|maxLength:50>
  creator_reference string<trim|length:20>
  links[]? {
    title string<trim|minLength:1|maxLength:100>
    url string<trim|maxLength:200>
  }
  service_rates? {
    currency string(NGN|USD|GBP|GHS)
    rates[] {
      name string<trim|minLength:3|maxLength:100>
      description string<trim|maxLength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<length:6>
}`;

const parsedSpec = validator.parse(spec);

// Helper function to build slugs manually without Regex patterns
function cleanTitleForSlug(title) {
  const lower = title.toLowerCase();
  let result = '';
  const allowed = 'abcdefghijklmnopqrstuvwxyz0123456789-_';
  
  for (let i = 0; i < lower.length; i++) {
    const char = lower[i];
    if (char === ' ') {
      result += '-';
    } else if (allowed.indexOf(char) !== -1) {
      result += char;
    }
  }
  return result;
}

// Helper to generate a random 6-character alphanumeric suffix
function generateRandomSuffix() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    suffix += chars[randomIndex];
  }
  return suffix;
}

async function createCard(serviceData, options = {}) {
  let response;

  // Step 2: Validate fields immediately via template engine
  const data = validator.validate(serviceData, parsedSpec);

  try {
    // Falls back to global connection pool context safely if needed
    const db = options.db || getDatabaseConnection(); 
    const accessType = data.access_type || 'public';

    // Step 3: Custom Conditional Access Rules (Enforces AC01 & AC05 keys)
    if (accessType === 'private' && !data.access_code) {
      throwAppError(CreatorCardMessages.ACCESS_CODE_REQUIRED, ERROR_CODE.AC01);
    }
    if (accessType === 'public' && data.access_code) {
      throwAppError(CreatorCardMessages.ACCESS_CODE_FORBIDDEN, ERROR_CODE.AC05);
    }

    let finalSlug = data.slug;

    if (!finalSlug) {
      // Run manual string manipulation sequence
      let baseSlug = cleanTitleForSlug(data.title);
      
      // Look up conflicts or length rules
      const existingCard = await db.collection('creator_cards').findOne({ slug: baseSlug, deleted: null });
      
      if (baseSlug.length < 5 || existingCard) {
        finalSlug = baseSlug + '-' + generateRandomSuffix();
      } else {
        finalSlug = baseSlug;
      }
    } else {
      // Strict layout verification loop for user-supplied slugs
      const allowedChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
      for (let i = 0; i < finalSlug.length; i++) {
        if (allowedChars.indexOf(finalSlug[i]) === -1) {
          throwAppError('Invalid characters provided inside slug string.', ERROR_CODE.VALIDATIONERR);
        }
      }

      const exactConflict = await db.collection('creator_cards').findOne({ slug: finalSlug, deleted: null });
      if (exactConflict) {
        throwAppError(CreatorCardMessages.SLUG_TAKEN, ERROR_CODE.SL02);
      }
    }

    // Save Entity Object to DB
    const now = Date.now();
    const newDocument = {
      _id: ulid(),
      title: data.title,
      description: data.description || null,
      slug: finalSlug,
      creator_reference: data.creator_reference,
      links: data.links || [],
      service_rates: data.service_rates ? {
        currency: data.service_rates.currency,
        rates: data.service_rates.rates
      } : null,
      status: data.status,
      access_type: accessType,
      access_code: data.access_code || null,
      created: now,
      updated: now,
      deleted: null
    };

    await db.collection('creator_cards').insertOne(newDocument);

    // Step 6: Single exit point - Return object response mapping internal serialization keys (_id -> id)
    response = {
      id: newDocument._id,
      title: newDocument.title,
      description: newDocument.description,
      slug: newDocument.slug,
      creator_reference: newDocument.creator_reference,
      links: newDocument.links,
      service_rates: newDocument.service_rates,
      status: newDocument.status,
      access_type: newDocument.access_type,
      access_code: newDocument.access_code,
      created: newDocument.created,
      updated: newDocument.updated,
      deleted: newDocument.deleted
    };

  } catch (error) {
    appLogger.errorX(error, 'create-card-service-error');
    throw error;
  }

  return response;
}

module.exports = createCard;
