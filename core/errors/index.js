const ERROR_CODE = {
    VALIDATIONERR: 'VALIDATIONERR',
    NOTFOUND: 'NOTFOUND',
    INVLDREQ: 'INVLDREQ',
    INVLDDATA: 'INVLDDATA',
    SL02: 'SL02',
    AC01: 'AC01',
    AC05: 'AC05',
    NF01: 'NF01',
    NF02: 'NF02',
    AC03: 'AC03',
    AC04: 'AC04'
  };
  
  function throwAppError(message, errorCode) {
    const error = new Error(message);
    error.code = errorCode;
    error.isAppError = true;
    throw error;
  }
  
  module.exports = {
    throwAppError,
    ERROR_CODE
  };
  