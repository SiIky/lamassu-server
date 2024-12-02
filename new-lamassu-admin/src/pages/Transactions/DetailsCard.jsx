import { useLazyQuery, useMutation } from '@apollo/react-hooks'
import { toUnit, formatCryptoAddress } from '@lamassu/coins/lightUtils'
import { makeStyles, Box } from '@material-ui/core'
import BigNumber from 'bignumber.js'
import classNames from 'classnames'
import { add, differenceInYears, format, sub, parse } from 'date-fns/fp'
import FileSaver from 'file-saver'
import gql from 'graphql-tag'
import JSZip from 'jszip'
import * as R from 'ramda'
import React, { memo, useState } from 'react'
import { ConfirmDialog } from 'src/components/ConfirmDialog'
import { HelpTooltip } from 'src/components/Tooltip'
import { P, Label1 } from 'src/components/typography'
import CardIdInverseIcon from 'src/styling/icons/ID/card/white.svg?react'
import CardIdIcon from 'src/styling/icons/ID/card/zodiac.svg?react'
import PhoneIdInverseIcon from 'src/styling/icons/ID/phone/white.svg?react'
import PhoneIdIcon from 'src/styling/icons/ID/phone/zodiac.svg?react'
import CamIdInverseIcon from 'src/styling/icons/ID/photo/white.svg?react'
import CamIdIcon from 'src/styling/icons/ID/photo/zodiac.svg?react'
import CancelInverseIcon from 'src/styling/icons/button/cancel/white.svg?react'
import CancelIcon from 'src/styling/icons/button/cancel/zodiac.svg?react'
import DownloadInverseIcon from 'src/styling/icons/button/download/white.svg?react'
import Download from 'src/styling/icons/button/download/zodiac.svg?react'
import TxInIcon from 'src/styling/icons/direction/cash-in.svg?react'
import TxOutIcon from 'src/styling/icons/direction/cash-out.svg?react'

import { IDButton, ActionButton } from 'src/components/buttons'
import {
  primaryColor,
  subheaderColor,
  errorColor,
  offErrorColor
} from 'src/styling/variables'
import { SWEEPABLE_CRYPTOS } from 'src/utils/constants'
import * as Customer from 'src/utils/customer'

import CopyToClipboard from './CopyToClipboard'
import styles from './DetailsCard.styles'
import { getStatus, getStatusDetails } from './helper'

const useStyles = makeStyles(styles)
const MINUTES_OFFSET = 3
const TX_SUMMARY = gql`
  query txSummaryAndLogs(
    $txId: ID!
    $deviceId: ID!
    $limit: Int
    $from: Date
    $until: Date
    $txClass: String
    $timezone: String
  ) {
    serverLogsCsv(
      limit: $limit
      from: $from
      until: $until
      timezone: $timezone
    )
    machineLogsCsv(
      deviceId: $deviceId
      limit: $limit
      from: $from
      until: $until
      timezone: $timezone
    )
    transactionCsv(id: $txId, txClass: $txClass, timezone: $timezone)
    txAssociatedDataCsv(id: $txId, txClass: $txClass, timezone: $timezone)
  }
`

const CANCEL_CASH_OUT_TRANSACTION = gql`
  mutation cancelCashOutTransaction($id: ID!) {
    cancelCashOutTransaction(id: $id) {
      id
    }
  }
`

const CANCEL_CASH_IN_TRANSACTION = gql`
  mutation cancelCashInTransaction($id: ID!) {
    cancelCashInTransaction(id: $id) {
      id
    }
  }
`

const getCryptoAmount = tx =>
  toUnit(new BigNumber(tx.cryptoAtoms), tx.cryptoCode).toNumber()

const getCryptoFeeAmount = tx => {
  const feeAmount = toUnit(new BigNumber(tx.fee), tx.cryptoCode).toNumber()

  return new BigNumber(feeAmount)
    .times(tx.rawTickerPrice)
    .toNumber()
    .toFixed(2, 1)
}

const formatAddress = (cryptoCode = '', address = '') =>
  formatCryptoAddress(cryptoCode, address).replace(/(.{5})/g, '$1 ')

const Label = ({ children }) => {
  const classes = useStyles()
  return <Label1 className={classes.label}>{children}</Label1>
}

const DetailsRow = ({ it: tx, timezone }) => {
  const classes = useStyles()
  const [action, setAction] = useState({ command: null })
  const [errorMessage, setErrorMessage] = useState('')

  const isCashIn = tx.txClass === 'cashIn'

  const zip = new JSZip()

  const [fetchSummary] = useLazyQuery(TX_SUMMARY, {
    onCompleted: data => createCsv(R.filter(it => !R.isEmpty(it), data))
  })

  const [cancelTransaction] = useMutation(
    isCashIn ? CANCEL_CASH_IN_TRANSACTION : CANCEL_CASH_OUT_TRANSACTION,
    {
      onError: ({ message }) =>
        setErrorMessage(message ?? 'An error occurred.'),
      refetchQueries: () => ['transactions']
    }
  )

  const commission = BigNumber(tx.profit).toFixed(2, 1) // ROUND_DOWN
  const commissionPercentage = BigNumber(
    Number.parseFloat(tx.commissionPercentage, 2) * 100
  ).toFixed(2, 1) // ROUND_DOWN
  const fixedFee = Number.parseFloat(tx.fixedFee) || 0
  const fiat = BigNumber(tx.fiat)
    .minus(fixedFee)
    .toFixed(2, 1) // ROUND_DOWN
  const crypto = getCryptoAmount(tx)
  const cryptoFee = tx.fee ? `${getCryptoFeeAmount(tx)} ${tx.fiatCode}` : 'N/A'
  const exchangeRate = BigNumber(fiat)
    .div(crypto)
    .toFixed(2, 1) // ROUND_DOWN
  const displayExRate = `1 ${tx.cryptoCode} = ${exchangeRate} ${tx.fiatCode}`
  const discount = tx.discount ? `-${tx.discount}%` : null

  const parseDateString = parse(new Date(), 'yyyyMMdd')

  const customer = tx.customerIdCardData && {
    name: Customer.formatFullName(tx.customerIdCardData),
    age:
      (tx.customerIdCardData.dateOfBirth &&
        differenceInYears(
          parseDateString(tx.customerIdCardData.dateOfBirth),
          new Date()
        )) ??
      '',
    country: tx.customerIdCardData.country,
    idCardNumber: tx.customerIdCardData.documentNumber,
    idCardExpirationDate:
      (tx.customerIdCardData.expirationDate &&
        format('yyyy-MM-dd')(
          parseDateString(tx.customerIdCardData.expirationDate)
        )) ??
      ''
  }

  const from = sub({ minutes: MINUTES_OFFSET }, new Date(tx.created))
  const until = add({ minutes: MINUTES_OFFSET }, new Date(tx.created))

  const downloadRawLogs = ({ id: txId, deviceId, txClass }, timezone) => {
    fetchSummary({
      variables: { txId, from, until, deviceId, txClass, timezone }
    })
  }

  const createCsv = async logs => {
    const zipFilename = `tx_${tx.id}_summary.zip`
    const filesNames = R.keys(logs)
    R.map(name => zip.file(name + '.csv', logs[name]), filesNames)
    const content = await zip.generateAsync({ type: 'blob' })
    FileSaver.saveAs(content, zipFilename)
  }

  const hasChainAnalysisError = tx =>
    !R.isNil(tx.errorCode) &&
    R.includes(tx.errorCode, ['scoreThresholdReached', 'walletScoringError'])

  const errorElements = (
    <>
      <Label>Transaction status</Label>
      <span className={classes.bold}>{getStatus(tx)}</span>
      {getStatusDetails(tx) ? (
        <CopyToClipboard removeSpace={false} className={classes.errorCopy}>
          {getStatusDetails(tx)}
        </CopyToClipboard>
      ) : (
        <></>
      )}
    </>
  )

  const walletScoreEl = (
    <div className={classes.walletScore}>
      <svg width={103} height={10}>
        {R.range(0, 10).map((it, idx) => (
            <circle
              key={idx}
              cx={it * 10 + 6}
              cy={4}
              r={3.5}
              fill={
                it < tx.walletScore
                  ? !hasChainAnalysisError(tx)
                    ? primaryColor
                    : errorColor
                  : !hasChainAnalysisError(tx)
                  ? subheaderColor
                  : offErrorColor
              }
            />
          )
        )}
      </svg>
      <P
        noMargin
        className={classNames({
          [classes.bold]: true,
          [classes.error]: hasChainAnalysisError(tx)
        })}>
        {tx.walletScore}
      </P>
    </div>
  )

  const getCancelMessage = () => {
    const cashInMessage = `The user will not be able to redeem the inserted bills, even if they subsequently confirm the transaction. If they've already deposited bills, you'll need to reconcile this transaction with them manually.`
    const cashOutMessage = `The user will not be able to redeem the cash, even if they subsequently send the required coins. If they've already sent you coins, you'll need to reconcile this transaction with them manually.`

    return isCashIn ? cashInMessage : cashOutMessage
  }

  return (
    <div className={classes.wrapper}>
      <div className={classes.row}>
        <div className={classes.direction}>
          <Label>Direction</Label>
          <div>
            <span className={classes.txIcon}>
              {!isCashIn ? <TxOutIcon /> : <TxInIcon />}
            </span>
            <span>{!isCashIn ? 'Cash-out' : 'Cash-in'}</span>
          </div>
        </div>

        <div className={classes.availableIds}>
          <Label>Available IDs</Label>
          <Box display="flex" flexDirection="row">
            {tx.customerPhone && (
              <IDButton
                className={classes.idButton}
                name="phone"
                Icon={PhoneIdIcon}
                InverseIcon={PhoneIdInverseIcon}>
                {tx.customerPhone}
              </IDButton>
            )}
            {tx.customerIdCardPhotoPath && !tx.customerIdCardData && (
              <IDButton
                popoverClassname={classes.clipboardPopover}
                className={classes.idButton}
                name="card"
                Icon={CardIdIcon}
                InverseIcon={CardIdInverseIcon}>
                <img
                  className={classes.idCardPhoto}
                  src={`/id-card-photo/${tx.customerIdCardPhotoPath}`}
                  alt=""
                />
              </IDButton>
            )}
            {tx.customerIdCardData && (
              <IDButton
                className={classes.idButton}
                name="card"
                Icon={CardIdIcon}
                InverseIcon={CardIdInverseIcon}>
                <div className={classes.idCardDataCard}>
                  <div>
                    <div>
                      <Label>Name</Label>
                      <div>{customer.name}</div>
                    </div>
                    <div>
                      <Label>Age</Label>
                      <div>{customer.age}</div>
                    </div>
                    <div>
                      <Label>Country</Label>
                      <div>{customer.country}</div>
                    </div>
                  </div>
                  <div>
                    <div>
                      <Label>ID number</Label>
                      <div>{customer.idCardNumber}</div>
                    </div>
                    <div>
                      <Label>Expiration date</Label>
                      <div>{customer.idCardExpirationDate}</div>
                    </div>
                  </div>
                </div>
              </IDButton>
            )}
            {tx.customerFrontCameraPath && (
              <IDButton
                className={classes.idButton}
                name="cam"
                Icon={CamIdIcon}
                InverseIcon={CamIdInverseIcon}>
                <img
                  src={`/front-camera-photo/${tx.customerFrontCameraPath}`}
                  alt=""
                />
              </IDButton>
            )}
            {tx.txCustomerPhotoPath && (
              <IDButton
                name="cam"
                Icon={CamIdIcon}
                InverseIcon={CamIdInverseIcon}>
                <img
                  src={`/operator-data/customersphotos/${tx.txCustomerPhotoPath}`}
                  alt=""
                />
              </IDButton>
            )}
          </Box>
        </div>
        <div className={classes.exchangeRate}>
          <Label>Exchange rate</Label>
          <div>{crypto > 0 ? displayExRate : '-'}</div>
        </div>
        <div className={classes.commission}>
          <Label>Commission</Label>
          <div className={classes.container}>
            {`${commission} ${tx.fiatCode} (${commissionPercentage} %)`}
            {discount && (
              <div className={classes.chip}>
                <Label1 className={classes.chipLabel}>{discount}</Label1>
              </div>
            )}
          </div>
        </div>
        <div>
          <Label>Fixed fee</Label>
          <div>{`${fixedFee} ${tx.fiatCode}`}</div>
        </div>
      </div>
      <div className={classes.secondRow}>
        <div className={classes.address}>
          <div className={classes.addressHeader}>
            <Label>Address</Label>
            {!R.isNil(tx.walletScore) && (
              <HelpTooltip parentElements={walletScoreEl}>
                {`Chain analysis score: ${tx.walletScore}/10`}
              </HelpTooltip>
            )}
          </div>
          <div>
            <CopyToClipboard>
              {formatAddress(tx.cryptoCode, tx.toAddress)}
            </CopyToClipboard>
          </div>
        </div>
        <div className={classes.transactionId}>
          <Label>Transaction ID</Label>
          <div>
            {tx.txClass === 'cashOut' ? (
              'N/A'
            ) : (
              <CopyToClipboard>{tx.txHash}</CopyToClipboard>
            )}
          </div>
        </div>
        {tx.txClass === 'cashIn' && (
          <div className={classes.blockFee}>
            <Label>Network Fee</Label>
            {cryptoFee}
          </div>
        )}
        <div className={classes.sessionId}>
          <Label>Session ID</Label>
          <CopyToClipboard>{tx.id}</CopyToClipboard>
        </div>
      </div>
      <div className={classes.lastRow}>
        <div className={classes.status}>
          {errorElements}
          {((tx.txClass === 'cashOut' && getStatus(tx) === 'Pending') ||
            (tx.txClass === 'cashIn' && getStatus(tx) === 'Batched')) && (
            <ActionButton
              color="primary"
              Icon={CancelIcon}
              InverseIcon={CancelInverseIcon}
              className={classes.cancelTransaction}
              onClick={() =>
                setAction({
                  command: 'cancelTx'
                })
              }>
              Cancel transaction
            </ActionButton>
          )}
        </div>
        {!R.isNil(tx.swept) && R.includes(tx.cryptoCode, SWEEPABLE_CRYPTOS) && (
          <div className={classes.swept}>
            <Label>Sweep status</Label>
            <span className={classes.bold}>
              {tx.swept ? `Swept` : `Unswept`}
            </span>
          </div>
        )}
        <div>
          <Label>Other actions</Label>
          <div className={classes.otherActionsGroup}>
            <ActionButton
              color="primary"
              Icon={Download}
              InverseIcon={DownloadInverseIcon}
              className={classes.downloadRawLogs}
              onClick={() => downloadRawLogs(tx, timezone)}>
              Download raw logs
            </ActionButton>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={action.command === 'cancelTx'}
        title={`Cancel this transaction?`}
        errorMessage={errorMessage}
        toBeConfirmed={tx.machineName}
        message={getCancelMessage()}
        onConfirmed={() => {
          setErrorMessage(null)
          setAction({ command: null })
          cancelTransaction({
            variables: {
              id: tx.id
            }
          })
        }}
        onDismissed={() => {
          setAction({ command: null })
          setErrorMessage(null)
        }}
      />
    </div>
  )
}

export default memo(
  DetailsRow,
  (prev, next) =>
    prev.it.id === next.it.id &&
    prev.it.hasError === next.it.hasError &&
    prev.it.batchError === next.it.batchError &&
    getStatus(prev.it) === getStatus(next.it)
)
