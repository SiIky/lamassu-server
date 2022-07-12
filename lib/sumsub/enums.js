const _ = require('lodash/fp')

const arr2obj = _.flow(_.map(k => [k, k]), _.fromPairs)

module.exports = {

  APPLICANT_TYPE: arr2obj(['individual', 'company']),

  DOCUMENT: {

    TYPE : arr2obj([
      'ID_CARD', 'PASSPORT', 'DRIVERS', 'RESIDENCE_PERMIT', 'UTILITY_BILL',
      'SELFIE', 'VIDEO_SELFIE', 'PROFILE_IMAGE', 'ID_DOC_PHOTO', 'AGREEMENT',
      'CONTRACT', 'DRIVERS_TRANSLATION', 'INVESTOR_DOC', 'INCOME_SOURCE',
      'PAYMENT_METHOD', 'VEHICLE_REGISTRATION_CERTIFICATE', 'BANK_CARD',
      'COVID_VACCINATION_FORM', 'OTHER',
    ]),

    SUBTYPE: arr2obj(['FRONT_SIDE', 'BACK_SIDE']),

    ERRORS: arr2obj([
      'forbiddenDocument', 'differentDocTypeOrCountry', 'missingImportantInfo',
      'dataNotReadable', 'expiredDoc', 'documentWayTooMuchOutside',
      'grayscale', 'noIdDocFacePhoto', 'screenRecapture', 'screenshot',
      'sameSides'
    ]),

    WARNINGS: arr2obj([
      'badSelfie', 'dataReadability', 'inconsistentDocument',
      'typeOrCountryChanged', 'maybeExpiredDoc', 'documentTooMuchOutside'
    ]),

  },

  REVIEW_STATUS: arr2obj(['init', 'pending', 'prechecked', 'queued', 'completed', 'onHold']),

}
