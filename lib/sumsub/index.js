const crypto = require("crypto")
const fs = require("fs")

const _ = require('lodash/fp')
const axios = require('axios')
const FormData = require('form-data')

require('dotenv').config({ path: "lib/sumsub/.env" })

const {
  DOCTYPE,
  DOCSUBTYPE,
  REVIEW_STATUS,
} = require('./enums')

const checkConst = mune => x => {
  const values = _.values(mune)
  if (!_.includes(x, values))
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

// `applicant` is an object with at least `externalUserId` (customer ID)
const createApplicant = (customerId, levelName='basic-kyc-level', applicant={}) => sumsub
  .post(
    `/resources/applicants?levelName=${levelName}`,
    JSON.stringify(_.set('externalUserId', customerId, applicant)),
  )

const addDocument = (applicantId, metadata, file=null, enableWarnings=true) => {
  const form = new FormData()
  form.append('metadata', JSON.stringify(metadata))
  if (file) form.append('content', fs.readFileSync(file), file)
  return sumsub
    .post(
      `/resources/applicants/${applicantId}/info/idDoc`,
      form,
      { headers: _.set('X-Return-Doc-Warnings', enableWarnings, form.getHeaders()) }
    )
}

const apiHealth = () => sumsub.get("/resources/status/api")

const getApplicantData = ({ applicantId, customerId }) =>
  applicantId ? sumsub.get(`/resources/applicants/${applicantId}/one`) :
  customerId ? sumsub.get(`/resources/applicants/-;externalUserId=${customerId}/one`) :
  Promise.reject(new Error("Must provide either `applicantId` or `customerId`"))

// Returns the status of the steps/documents of an applicant
//
// {
//   IDENTITY: {
//     reviewResult: {},
//     country: 'USA',
//     idDocType: 'PASSPORT',
//     imageIds: [ 1710542288 ],
//     imageReviewResults: { '1710542288': {} },
//     forbidden: false,
//     doubleSided: false,
//     stepStatuses: null
//   }
// }
const getApplicantDocumentsStatus = applicantId => sumsub
  .get(`/resources/applicants/${applicantId}/requiredIdDocsStatus`)

// Returns the status of an applicant
//
// {
//   reviewId: 'WGTQN',
//   attemptId: 'ZcdRi',
//   attemptCnt: 0,
//   reprocessing: false,
//   levelName: 'basic-kyc-level',
//   createDate: '2022-07-07 15:55:37+0000',
//   reviewStatus: 'init',
//   priority: 0,
//   autoChecked: false
// }
const getApplicantStatus = applicantId => sumsub
  .get(`/resources/applicants/${applicantId}/status`)
  .then(_.update('data', _.update('reviewStatus', checkConst(REVIEW_STATUS))))


const getApplicantReviewStatus = applicantId =>
  getApplicantStatus(applicantId)
    .then(_.get(['data', 'reviewStatus']))

const changeApplicantStatus = (applicantId, reason=null) => sumsub
  .post(`/resources/applicants/${applicantId}/status/pending`
    + (reason ? `?reason=${reason}` : '')
  )

const getRejectReason = applicantId => sumsub
  .get(`/resources/moderationStates/-;applicantId=${applicantId}`)

// https://developers.sumsub.com/api-flow
// Steps:
// 1. Create applicant
// 2. Upload all necessary documents (before the next step)
// 3. Request an applicant check (POST /resources/applicants/${applicantId}/status/pending)
// 4. Get verification results (does it work through webhooks only? or can we manually poll for it?)
// 5. Reupload rejected documents, if needed

const uuid = require('uuid')

const customerId = uuid.v4()

console.log("customerId:", customerId)

getRejectReason("62c701f9fe4aab000195bb9b")
  .then(_.flow(_.get(['data']), console.log))
  .catch(console.error)

//getApplicantData({ applicantId: "62c56b44c2e0d90001a97008"})
//getApplicantData({ customerId: "user1"})
//getApplicantStatus("62c56b44c2e0d90001a97008")
//createApplicant(customerId)
//  .then(({ data }) => {
//    console.log("data:", data)
//    const { id: applicantId } = data
//    console.log("applicantId:", applicantId)
//    return addDocument(
//      applicantId,
//      {
//        country: 'USA',
//        idDocType: DOCTYPE.PASSPORT,
//      },
//      'compliance/usa-passport4.jpg',
//    )
//  })
//  .then(console.log)
//  .catch(console.error)

module.exports = {
  checkConst,
}
