const crypto = require("crypto")
const fs = require("fs")

const _ = require('lodash/fp')
const axios = require('axios')
const FormData = require('form-data')

require('dotenv').config({ path: "lib/sumsub/.env" })

const {
  APPLICANT_TYPE,
  DOCUMENT,
  REVIEW_STATUS,
} = require('./enums')

const checkConst = mune => x => {
  if (x !== undefined && mune[x] === undefined)
    throw new Error('Unexpected value ' + x + '; expected values: ' + values)
  return x
}


const URL = false ? "http://localhost/" : process.env.SUMSUB_URL
const TOKEN = process.env.SUMSUB_TOKEN
const SECRET_KEY = process.env.SUMSUB_SECRET_KEY

const addXAppAccessHeaders = secretKey => cfg => {
  const ts = Math.ceil(Date.now() / 1000).toString()
  const sig = crypto.createHmac("sha256", secretKey)

  sig.update(ts + cfg.method.toUpperCase() + cfg.url)

  if (cfg.data instanceof FormData)
    sig.update(cfg.data.getBuffer())
  else if (cfg.data)
    sig.update(cfg.data)

  cfg.headers["X-App-Access-Sig"] = sig.digest("hex")
  cfg.headers["X-App-Access-Ts"] = ts

  return cfg
}

const Sumsub = (url, token, secretKey) => {
  const sumsub = axios.create({
    baseURL: url,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-App-Token": token,
    },
  })
  sumsub.interceptors.request.use(addXAppAccessHeaders(secretKey), Promise.reject)
  return sumsub
}

const sumsub = Sumsub(URL, TOKEN, SECRET_KEY)

/*
 * https://developers.sumsub.com/api-reference/#creating-an-applicant
 *
 * @brief Creates an Applicant for a given customer.
 *
 * @param customerId The ID of the customer in our `customers` table.
 * @param levelName The name of the applicant level to use for this customer.
 * @param applicant Extra optional information about the customer.
 *
 * `review.reviewStatus` must be one of `REVIEW_STATUS`.
 * `type` must be one of `APPLICANT_TYPE`.
 *
 * {
 *   id: '62cd6ba0ddf8cf00017391ae',
 *   createdAt: '2022-07-12 12:40:00',
 *   key: '...',
 *   clientId: '...',
 *   inspectionId: '62cd6ba0ddf8cf00017391af',
 *   externalUserId: '38d804cb-98d6-4ba8-bda7-49533d1c64b6',
 *   info: {},
 *   requiredIdDocs: { docSets: [ [Object] ] },
 *   review: {
 *     reviewId: '...',
 *     attemptId: '...',
 *     attemptCnt: 0,
 *     reprocessing: false,
 *     levelName: 'basic-kyc-level',
 *     createDate: '2022-07-12 12:40:00+0000',
 *     reviewStatus: 'init',
 *     priority: 0,
 *     autoChecked: false
 *   },
 *   type: 'individual'
 * }
 */
const createApplicant = (customerId, levelName='basic-kyc-level', applicant={}) => sumsub
  .post(
    `/resources/applicants?levelName=${levelName}`,
    JSON.stringify(_.set('externalUserId', customerId, applicant)),
  )
  .then(_.update(['data', 'review', 'reviewStatus'], checkConst(REVIEW_STATUS)))

/*
 * https://developers.sumsub.com/api-reference/#adding-an-id-document
 *
 * @brief Uploads a document to an applicant.
 *
 * @param applicantId The ID of the applicant, returned from `createApplicant()`.
 * @param metadata An object with at least the country and type of the
 *        document, and if applicable whether it's from or back. @see DOCUMENT
 *
 * {
 *   idDocType: 'PASSPORT',
 *   country: 'USA',
 *   errors: [...],
 *   warnings: [...]
 * }
 *
 * `errors` and `warnings` should contain elements of `DOCUMENT.ERRORS` and
 * `DOCUMENT.WARNINGS`, respectively.
 */
const addDocument = (applicantId, metadata, file=null, enableWarnings=true) => {
  const form = new FormData()
  form.append('metadata', JSON.stringify(metadata))
  if (file) form.append('content', fs.readFileSync(file), file)
  return sumsub.post(
    `/resources/applicants/${applicantId}/info/idDoc`,
    form,
    { headers: _.set('X-Return-Doc-Warnings', enableWarnings, form.getHeaders()) }
  )
  .then(_.flow(
    _.update(['data', 'errors'], _.map(checkConst(DOCUMENT.ERRORS))),
    _.update(['data', 'warnings'], _.map(checkConst(DOCUMENT.WARNINGS))),
  ))
}

/* https://developers.sumsub.com/api-reference/#api-health */
const apiHealth = () => sumsub.get("/resources/status/api")

/*
 * https://developers.sumsub.com/api-reference/#getting-applicant-data
 *
 * @param An object with either `applicantId` or `customerId`.
 *
 * @returns Similar to `createApplicant()`
 *
 * {
 *   id: '62cd75e485809000019ae7aa',
 *   createdAt: '2022-07-12 13:23:48',
 *   key: '...',
 *   clientId: '...',
 *   inspectionId: '62cd75e485809000019ae7ab',
 *   externalUserId: '375e08ee-f536-493a-94b8-7cea937c608b',
 *   info: { country: 'USA', idDocs: [ [Object] ] },
 *   applicantPlatform: 'API',
 *   requiredIdDocs: { docSets: [ [Object] ] },
 *   review: {
 *     reviewId: '...',
 *     attemptId: '...',
 *     attemptCnt: 0,
 *     reprocessing: false,
 *     levelName: 'basic-kyc-level',
 *     createDate: '2022-07-12 13:23:48+0000',
 *     reviewStatus: 'init',
 *     priority: 0,
 *     autoChecked: false
 *   },
 *   type: 'individual'
 * }
 */
const getApplicantData = ({ applicantId, customerId }) =>
  applicantId ? sumsub.get(`/resources/applicants/${applicantId}/one`) :
  customerId ? sumsub.get(`/resources/applicants/-;externalUserId=${customerId}/one`) :
  Promise.reject(new Error("Must provide either `applicantId` or `customerId`"))

/*
 * https://developers.sumsub.com/api-reference/#getting-applicant-status-api
 *
 * Returns the status of the steps/documents of an applicant.
 *
 * {
 *   IDENTITY: {
 *     reviewResult: {},
 *     country: 'USA',
 *     idDocType: 'PASSPORT',
 *     imageIds: [ 1710542288 ],
 *     imageReviewResults: { '1710542288': {} },
 *     forbidden: false,
 *     doubleSided: false,
 *     stepStatuses: null
 *   }
 * }
 */
const getApplicantDocumentsStatus = applicantId => sumsub
  .get(`/resources/applicants/${applicantId}/requiredIdDocsStatus`)

/*
 * https://developers.sumsub.com/api-reference/#getting-applicant-status-sdk
 *
 * Returns the status of an applicant
 *
 * {
 *   reviewId: 'WGTQN',
 *   attemptId: 'ZcdRi',
 *   attemptCnt: 0,
 *   reprocessing: false,
 *   levelName: 'basic-kyc-level',
 *   createDate: '2022-07-07 15:55:37+0000',
 *   reviewStatus: 'init',
 *   priority: 0,
 *   autoChecked: false
 * }
 */
const getApplicantStatus = applicantId => sumsub
  .get(`/resources/applicants/${applicantId}/status`)
  .then(_.update(['data', 'reviewStatus'], checkConst(REVIEW_STATUS)))


/*
 * Gets the review status of an applicant, as returned by
 * `getApplicantStatus()`.
 */
const getApplicantReviewStatus = applicantId =>
  getApplicantStatus(applicantId)
    .then(_.get(['data', 'reviewStatus']))

/*
 * https://developers.sumsub.com/api-reference/#requesting-an-applicant-check
 *
 * @brief Ask Sumsub to review an applicant.
 */
const changeApplicantStatus = (applicantId, reason=null) => sumsub
  .post(`/resources/applicants/${applicantId}/status/pending`
    + (reason ? `?reason=${reason}` : '')
  )

/*
 * https://developers.sumsub.com/api-reference/#clarifying-the-reason-of-rejection
 */
const getRejectReason = applicantId => sumsub
  .get(`/resources/moderationStates/-;applicantId=${applicantId}`)

/*
 * https://developers.sumsub.com/api-flow
 * Steps:
 * 1. Create applicant
 * 2. Upload all necessary documents (before the next step)
 * 3. Request an applicant check (POST /resources/applicants/${applicantId}/status/pending)
 * 4. Get verification results (does it work through webhooks only? or can we manually poll for it?)
 * 5. Reupload rejected documents, if needed
 */

const uuid = require('uuid')

const customerId = uuid.v4()

console.log("customerId:", customerId)

createApplicant(customerId)
  .then(({ data: { id: applicantId } }) => {
    console.log("applicantId:", applicantId)
    return addDocument(
      applicantId,
      { country: 'USA', idDocType: DOCUMENT.TYPE.PASSPORT },
      'compliance/usa-passport3.jpg'
    )
    .then(() => Promise.all([
        getApplicantStatus("62cda10c9ae7ab00013b3e82"),
        getApplicantDocumentsStatus("62cda10c9ae7ab00013b3e82"),
        getRejectReason("62cda10c9ae7ab00013b3e82"),
      ])
      .then(([applicantStatus, applicantDocumentStatus, rejectReason]) => ({ applicantStatus, applicantDocumentStatus, rejectReason }))
      .then(_.flow(
        _.update(['applicantStatus'], _.get(['data'])),
        _.update(['applicantDocumentStatus'], _.get(['data'])),
        _.update(['rejectReason'], _.get(['data'])),
      ))
      .then(({ applicantStatus, applicantDocumentStatus, rejectReason }) => {
        console.log("applicantStatus:", applicantStatus)
        console.log("applicantDocumentStatus:", applicantDocumentStatus)
        console.log("rejectReason:", rejectReason)
      }))
  })
  .catch(console.error)

module.exports = {
  checkConst,
}
