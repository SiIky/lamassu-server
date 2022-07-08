const _ = require('lodash/fp')

const arr2obj = _.flow(_.map(k => [k, k]), _.fromPairs)

module.exports = {

  DOCTYPE : arr2obj([
    'ID_CARD',
    'PASSPORT',
    'DRIVERS',
    'RESIDENCE_PERMIT',
    'UTILITY_BILL',
    'SELFIE',
    'VIDEO_SELFIE',
    'PROFILE_IMAGE',
    'ID_DOC_PHOTO',
    'AGREEMENT',
    'CONTRACT',
    'DRIVERS_TRANSLATION',
    'INVESTOR_DOC',
    'VEHICLE_REGISTRATION_CERTIFICATE',
    'INCOME_SOURCE',
    'PAYMENT_METHOD',
    'BANK_CARD',
    'COVID_VACCINATION_FORM',
    'OTHER',
  ]),

  DOCSUBTYPE: arr2obj(['FRONT_SIDE', 'BACK_SIDE']),

  REVIEW_STATUS: arr2obj(['init', 'pending', 'prechecked', 'queued', 'completed', 'onHold']),
}
