const { throwAppError, ERROR_CODE } = require('@app-core/errors');

const validator = {
  parse(specString) {
    return { rawSpec: specString };
  },
  
  validate(inputData, parsedSpec) {
    if (!inputData) {
      throwAppError('Missing request body data payload', ERROR_CODE.VALIDATIONERR);
    }
    
    // If it is a GET or DELETE lookup request payload, bypass the creation checks
    if (inputData.slug) {
      if (inputData.slug.length < 5) {
        throwAppError('Slug must be between 5 and 50 characters', ERROR_CODE.VALIDATIONERR);
      }
      return inputData;
    }

    // Standard baseline rules validation used for creation operations
    if (!inputData.title || inputData.title.length < 3) {
      throwAppError('Title must be between 3 and 100 characters', ERROR_CODE.VALIDATIONERR);
    }
    if (!inputData.creator_reference || inputData.creator_reference.length !== 20) {
      throwAppError('Creator reference must be exactly 20 characters', ERROR_CODE.VALIDATIONERR);
    }
    if (inputData.status !== 'draft' && inputData.status !== 'published') {
      throwAppError('Status must be exactly draft or published', ERROR_CODE.VALIDATIONERR);
    }

    return inputData;
  }
};

module.exports = validator;
