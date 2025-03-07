import { useQuery } from '@apollo/react-hooks'
import { makeStyles, Box } from '@material-ui/core'
import classnames from 'classnames'
import { Field, useFormikContext } from 'formik'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React, { memo } from 'react'
import * as Yup from 'yup'

import { NumberInput, RadioGroup, Dropdown } from 'src/components/inputs/formik'
import { H4, Label2, Label1, Info1, Info2 } from 'src/components/typography'
import { errorColor } from 'src/styling/variables'
import { transformNumber } from 'src/utils/number'

// import { ReactComponent as TxInIcon } from 'src/styling/icons/direction/cash-in.svg'
// import { ReactComponent as TxOutIcon } from 'src/styling/icons/direction/cash-out.svg'

const useStyles = makeStyles({
  radioLabel: {
    height: 40,
    padding: [[0, 10]]
  },
  radio: {
    padding: 4,
    margin: 4
  },
  radioGroup: {
    flexDirection: 'row'
  },
  error: {
    color: errorColor
  },
  specialLabel: {
    height: 40,
    padding: 0
  },
  specialGrid: {
    display: 'grid',
    gridTemplateColumns: [[182, 162, 181]]
  },
  directionIcon: {
    marginRight: 2
  },
  directionName: {
    marginLeft: 6
  },
  thresholdWrapper: {
    display: 'flex',
    flexDirection: 'column'
  },
  thresholdTitle: {
    marginTop: 50
  },
  thresholdContentWrapper: {
    display: 'flex',
    flexDirection: 'row'
  },
  thresholdField: {
    marginRight: 6,
    width: 75
  },
  description: {
    marginTop: 7
  },
  space: {
    marginLeft: 6,
    marginRight: 6
  },
  lastSpace: {
    marginLeft: 6
  },
  suspensionDays: {
    width: 34
  },
  input: {
    marginTop: -2
  },
  limitedInput: {
    width: 50
  },
  daysInput: {
    width: 60
  },
  dropdownField: {
    marginTop: 16,
    minWidth: 155
  }
})

// const direction = Yup.string().required()

const triggerType = Yup.string().required()
const threshold = Yup.object().shape({
  threshold: Yup.number()
    .nullable()
    .transform(transformNumber)
    .label('Invalid threshold'),
  thresholdDays: Yup.number()
    .transform(transformNumber)
    .nullable()
    .label('Invalid threshold days')
})

const requirement = Yup.object().shape({
  requirement: Yup.string().required(),
  suspensionDays: Yup.number()
    .transform(transformNumber)
    .nullable()
})

const Schema = Yup.object()
  .shape({
    triggerType,
    requirement,
    threshold
    // direction
  })
  .test(({ threshold, triggerType }, context) => {
    const errorMessages = {
      txAmount: threshold => 'Amount must be greater than or equal to 0',
      txVolume: threshold => {
        const thresholdMessage = 'Volume must be greater than or equal to 0'
        const thresholdDaysMessage = 'Days must be greater than 0'
        const message = []
        if (threshold.threshold < 0) message.push(thresholdMessage)
        if (threshold.thresholdDays <= 0) message.push(thresholdDaysMessage)
        return message.join(', ')
      },
      txVelocity: threshold => {
        const thresholdMessage = 'Transactions must be greater than 0'
        const thresholdDaysMessage = 'Days must be greater than 0'
        const message = []
        if (threshold.threshold <= 0) message.push(thresholdMessage)
        if (threshold.thresholdDays <= 0) message.push(thresholdDaysMessage)
        return message.join(', ')
      },
      consecutiveDays: threshold => 'Days must be greater than 0'
    }
    const thresholdValidator = {
      txAmount: threshold => threshold.threshold >= 0,
      txVolume: threshold =>
        threshold.threshold >= 0 && threshold.thresholdDays > 0,
      txVelocity: threshold =>
        threshold.threshold > 0 && threshold.thresholdDays > 0,
      consecutiveDays: threshold => threshold.thresholdDays > 0
    }

    if (triggerType && thresholdValidator[triggerType](threshold)) return

    return context.createError({
      path: 'threshold',
      message: errorMessages[triggerType](threshold)
    })
  })
  .test(({ requirement }, context) => {
    const requirementValidator = requirement =>
      requirement.requirement === 'suspend'
        ? requirement.suspensionDays > 0
        : true

    if (requirement && requirementValidator(requirement)) return

    return context.createError({
      path: 'requirement',
      message: 'Suspension days must be greater than 0'
    })
  })

// Direction V2 only
// const directionSchema = Yup.object().shape({ direction })

// const directionOptions = [
//   {
//     display: 'Both',
//     code: 'both'
//   },
//   {
//     display: 'Only cash-in',
//     code: 'cashIn'
//   },
//   {
//     display: 'Only cash-out',
//     code: 'cashOut'
//   }
// ]

// const directionOptions2 = [
//   {
//     display: (
//       <>
//         <TxInIcon /> in
//       </>
//     ),
//     code: 'cashIn'
//   },
//   {
//     display: (
//       <>
//         <TxOutIcon /> out
//       </>
//     ),
//     code: 'cashOut'
//   },
//   {
//     display: (
//       <>
//         <Box display="flex">
//           <Box mr={0.25}>
//             <TxOutIcon />
//           </Box>
//           <Box>
//             <TxInIcon />
//           </Box>
//         </Box>
//       </>
//     ),
//     code: 'both'
//   }
// ]

// const Direction = () => {
//   const classes = useStyles()
//   const { errors } = useFormikContext()

//   const titleClass = {
//     [classes.error]: errors.direction
//   }

//   return (
//     <>
//       <Box display="flex" alignItems="center">
//         <H4 className={classnames(titleClass)}>
//           In which type of transactions will it trigger?
//         </H4>
//       </Box>
//       <Field
//         component={RadioGroup}
//         name="direction"
//         options={directionOptions}
//         labelClassName={classes.radioLabel}
//         radioClassName={classes.radio}
//         className={classes.radioGroup}
//       />
//     </>
//   )
// }

// const txDirection = {
//   schema: directionSchema,
//   options: directionOptions,
//   Component: Direction,
//   initialValues: { direction: '' }
// }

// TYPE
const typeSchema = Yup.object()
  .shape({
    triggerType: Yup.string().required(),
    threshold: Yup.object({
      threshold: Yup.number()
        .transform(transformNumber)
        .nullable(),
      thresholdDays: Yup.number()
        .transform(transformNumber)
        .nullable()
    })
  })
  .test(({ threshold, triggerType }, context) => {
    const errorMessages = {
      txAmount: threshold => 'Amount must be greater than or equal to 0',
      txVolume: threshold => {
        const thresholdMessage = 'Volume must be greater than or equal to 0'
        const thresholdDaysMessage = 'Days must be greater than 0'
        const message = []
        if (!threshold.threshold || threshold.threshold < 0)
          message.push(thresholdMessage)
        if (!threshold.thresholdDays || threshold.thresholdDays <= 0)
          message.push(thresholdDaysMessage)
        return message.join(', ')
      },
      txVelocity: threshold => {
        const thresholdMessage = 'Transactions must be greater than 0'
        const thresholdDaysMessage = 'Days must be greater than 0'
        const message = []
        if (!threshold.threshold || threshold.threshold <= 0)
          message.push(thresholdMessage)
        if (!threshold.thresholdDays || threshold.thresholdDays <= 0)
          message.push(thresholdDaysMessage)
        return message.join(', ')
      },
      consecutiveDays: threshold => 'Days must be greater than 0'
    }
    const thresholdValidator = {
      txAmount: threshold => threshold.threshold >= 0,
      txVolume: threshold =>
        threshold.threshold >= 0 && threshold.thresholdDays > 0,
      txVelocity: threshold =>
        threshold.threshold > 0 && threshold.thresholdDays > 0,
      consecutiveDays: threshold => threshold.thresholdDays > 0
    }

    if (triggerType && thresholdValidator[triggerType](threshold)) return

    return context.createError({
      path: 'threshold',
      message: errorMessages[triggerType](threshold)
    })
  })

const typeOptions = [
  { display: 'Transaction amount', code: 'txAmount' },
  { display: 'Transaction volume', code: 'txVolume' },
  { display: 'Transaction velocity', code: 'txVelocity' },
  { display: 'Consecutive days', code: 'consecutiveDays' }
]

const Type = ({ ...props }) => {
  const classes = useStyles()
  const {
    errors,
    touched,
    values,
    setTouched,
    handleChange
  } = useFormikContext()

  const typeClass = {
    [classes.error]: errors.triggerType && touched.triggerType
  }

  const containsType = R.contains(values?.triggerType)
  const isThresholdCurrencyEnabled = containsType(['txAmount', 'txVolume'])
  const isTransactionAmountEnabled = containsType(['txVelocity'])
  const isThresholdDaysEnabled = containsType(['txVolume', 'txVelocity'])
  const isConsecutiveDaysEnabled = containsType(['consecutiveDays'])

  const hasAmountError =
    !!errors.threshold &&
    !!touched.threshold?.threshold &&
    !isConsecutiveDaysEnabled &&
    (!values.threshold?.threshold || values.threshold?.threshold < 0)
  const hasDaysError =
    !!errors.threshold &&
    !!touched.threshold?.thresholdDays &&
    !containsType(['txAmount']) &&
    (!values.threshold?.thresholdDays || values.threshold?.thresholdDays < 0)

  const triggerTypeError = !!(hasDaysError || hasAmountError)

  const thresholdClass = {
    [classes.error]: triggerTypeError
  }

  const isRadioGroupActive = () => {
    return (
      isThresholdCurrencyEnabled ||
      isTransactionAmountEnabled ||
      isThresholdDaysEnabled ||
      isConsecutiveDaysEnabled
    )
  }

  return (
    <>
      <Box display="flex" alignItems="center">
        <H4 className={classnames(typeClass)}>Choose trigger type</H4>
      </Box>
      <Field
        component={RadioGroup}
        name="triggerType"
        options={typeOptions}
        labelClassName={classes.radioLabel}
        radioClassName={classes.radio}
        className={classes.radioGroup}
        onChange={e => {
          handleChange(e)
          setTouched({
            threshold: false,
            thresholdDays: false
          })
        }}
      />

      <div className={classes.thresholdWrapper}>
        {isRadioGroupActive() && (
          <H4 className={classnames(thresholdClass, classes.thresholdTitle)}>
            Threshold
          </H4>
        )}
        <div className={classes.thresholdContentWrapper}>
          {isThresholdCurrencyEnabled && (
            <>
              <Field
                className={classes.thresholdField}
                component={NumberInput}
                size="lg"
                name="threshold.threshold"
                error={hasAmountError}
              />
              <Info1 className={classnames(classes.description)}>
                {props.currency}
              </Info1>
            </>
          )}
          {isTransactionAmountEnabled && (
            <>
              <Field
                className={classes.thresholdField}
                component={NumberInput}
                size="lg"
                name="threshold.threshold"
                error={hasAmountError}
              />
              <Info1 className={classnames(classes.description)}>
                transactions
              </Info1>
            </>
          )}
          {isThresholdDaysEnabled && (
            <>
              <Info1
                className={classnames(
                  typeClass,
                  classes.space,
                  classes.description
                )}>
                in
              </Info1>
              <Field
                className={classes.thresholdField}
                component={NumberInput}
                size="lg"
                name="threshold.thresholdDays"
                error={hasDaysError}
              />
              <Info1 className={classnames(classes.description)}>days</Info1>
            </>
          )}
          {isConsecutiveDaysEnabled && (
            <>
              <Field
                className={classes.thresholdField}
                component={NumberInput}
                size="lg"
                name="threshold.thresholdDays"
                error={hasDaysError}
              />
              <Info1 className={classnames(classes.description)}>
                consecutive days
              </Info1>
            </>
          )}
        </div>
      </div>
    </>
  )
}

const type = currency => ({
  schema: typeSchema,
  options: typeOptions,
  Component: Type,
  props: { currency },
  initialValues: {
    triggerType: '',
    threshold: { threshold: '', thresholdDays: '' }
  }
})

const requirementSchema = Yup.object()
  .shape({
    requirement: Yup.object({
      requirement: Yup.string().required(),
      suspensionDays: Yup.number().when('requirement', {
        is: value => value === 'suspend',
        then: Yup.number()
          .nullable()
          .transform(transformNumber),
        otherwise: Yup.number()
          .nullable()
          .transform(() => null)
      })
    }).required()
  })
  .test(({ requirement }, context) => {
    const requirementValidator = requirement =>
      requirement.requirement === 'suspend'
        ? requirement.suspensionDays > 0
        : true

    if (requirement && requirementValidator(requirement)) return

    return context.createError({
      path: 'requirement',
      message: 'Suspension days must be greater than 0'
    })
  })

const requirementOptions = [
  { display: 'SMS verification', code: 'sms' },
  { display: 'ID card image', code: 'idCardPhoto' },
  { display: 'ID data', code: 'idCardData' },
  { display: 'Customer camera', code: 'facephoto' },
  { display: 'Sanctions', code: 'sanctions' },
  { display: 'US SSN', code: 'usSsn' },
  // { display: 'Super user', code: 'superuser' },
  { display: 'Suspend', code: 'suspend' },
  { display: 'Block', code: 'block' }
]

const GET_ACTIVE_CUSTOM_REQUESTS = gql`
  query customInfoRequests($onlyEnabled: Boolean) {
    customInfoRequests(onlyEnabled: $onlyEnabled) {
      id
      customRequest
    }
  }
`

const Requirement = () => {
  const classes = useStyles()
  const {
    touched,
    errors,
    values,
    handleChange,
    setTouched
  } = useFormikContext()
  const { data } = useQuery(GET_ACTIVE_CUSTOM_REQUESTS, {
    variables: {
      onlyEnabled: true
    }
  })

  const isSuspend = values?.requirement?.requirement === 'suspend'
  const isCustom = values?.requirement?.requirement === 'custom'
  const makeCustomReqOptions = () =>
    customInfoRequests.map(it => ({
      value: it.id,
      display: it.customRequest.name
    }))

  const hasRequirementError =
    !!errors.requirement &&
    !!touched.requirement?.suspensionDays &&
    (!values.requirement?.suspensionDays ||
      values.requirement?.suspensionDays < 0)

  const customInfoRequests = R.path(['customInfoRequests'])(data) ?? []
  const enableCustomRequirement = customInfoRequests.length > 0
  const customInfoOption = {
    display: 'Custom information requirement',
    code: 'custom'
  }
  const options = enableCustomRequirement
    ? [...requirementOptions, customInfoOption]
    : [...requirementOptions, { ...customInfoOption, disabled: true }]
  const titleClass = {
    [classes.error]:
      (!!errors.requirement && !isSuspend) || (isSuspend && hasRequirementError)
  }

  return (
    <>
      <Box display="flex" alignItems="center">
        <H4 className={classnames(titleClass)}>Choose a requirement</H4>
      </Box>
      <Field
        component={RadioGroup}
        name="requirement.requirement"
        options={options}
        labelClassName={classes.specialLabel}
        radioClassName={classes.radio}
        className={classnames(classes.radioGroup, classes.specialGrid)}
        onChange={e => {
          handleChange(e)
          setTouched({
            suspensionDays: false
          })
        }}
      />
      {isSuspend && (
        <Field
          className={classes.thresholdField}
          component={NumberInput}
          label="Days"
          size="lg"
          name="requirement.suspensionDays"
          error={hasRequirementError}
        />
      )}
      {isCustom && (
        <div>
          <Field
            className={classes.dropdownField}
            component={Dropdown}
            label="Available requests"
            name="requirement.customInfoRequestId"
            options={makeCustomReqOptions()}
          />
        </div>
      )}
    </>
  )
}

const requirements = {
  schema: requirementSchema,
  options: requirementOptions,
  Component: Requirement,
  initialValues: {
    requirement: {
      requirement: '',
      suspensionDays: '',
      customInfoRequestId: ''
    }
  }
}

const getView = (data, code, compare) => it => {
  if (!data) return ''

  return R.compose(R.prop(code), R.find(R.propEq(compare ?? 'code', it)))(data)
}

// const DirectionDisplay = ({ code }) => {
//   const classes = useStyles()
//   const displayName = getView(directionOptions, 'display')(code)
//   const showCashIn = code === 'cashIn' || code === 'both'
//   const showCashOut = code === 'cashOut' || code === 'both'

//   return (
//     <div>
//       {showCashOut && <TxOutIcon className={classes.directionIcon} />}
//       {showCashIn && <TxInIcon className={classes.directionIcon} />}
//       <span className={classes.directionName}>{displayName}</span>
//     </div>
//   )
// }

const customReqIdMatches = customReqId => it => {
  return it.id === customReqId
}

const RequirementInput = ({ customInfoRequests }) => {
  const { values } = useFormikContext()
  const classes = useStyles()

  const requirement = values?.requirement?.requirement
  const customRequestId =
    R.path(['requirement', 'customInfoRequestId'])(values) ?? ''
  const isSuspend = requirement === 'suspend'
  const display = customRequestId
    ? R.path(['customRequest', 'name'])(
        R.find(customReqIdMatches(customRequestId))(customInfoRequests)
      ) ?? ''
    : getView(requirementOptions, 'display')(requirement)

  return (
    <Box display="flex" alignItems="baseline">
      {`${display} ${isSuspend ? 'for' : ''}`}
      {isSuspend && (
        <Field
          bold
          className={classes.suspensionDays}
          name="requirement.suspensionDays"
          component={NumberInput}
          textAlign="center"
        />
      )}
      {isSuspend && 'days'}
    </Box>
  )
}

const RequirementView = ({
  requirement,
  suspensionDays,
  customInfoRequestId,
  customInfoRequests
}) => {
  const classes = useStyles()
  const display =
    requirement === 'custom'
      ? R.path(['customRequest', 'name'])(
          R.find(customReqIdMatches(customInfoRequestId))(customInfoRequests)
        ) ?? ''
      : getView(requirementOptions, 'display')(requirement)
  const isSuspend = requirement === 'suspend'
  return (
    <Box display="flex" alignItems="baseline">
      {`${display} ${isSuspend ? 'for' : ''}`}
      {isSuspend && (
        <Info2 className={classes.space} noMargin>
          {suspensionDays}
        </Info2>
      )}
      {isSuspend && 'days'}
    </Box>
  )
}

const DisplayThreshold = ({ config, currency, isEdit }) => {
  const classes = useStyles()

  const inputClasses = {
    [classes.input]: true,
    [classes.limitedInput]: config?.triggerType === 'txVelocity',
    [classes.daysInput]: config?.triggerType === 'consecutiveDays'
  }

  const threshold = config?.threshold?.threshold
  const thresholdDays = config?.threshold?.thresholdDays

  const Threshold = isEdit ? (
    <Field
      bold
      className={classnames(inputClasses)}
      name="threshold.threshold"
      component={NumberInput}
      textAlign="right"
    />
  ) : (
    <Info2 noMargin>{threshold}</Info2>
  )
  const ThresholdDays = isEdit ? (
    <Field
      bold
      className={classnames(inputClasses)}
      name="threshold.thresholdDays"
      component={NumberInput}
      textAlign="right"
    />
  ) : (
    <Info2 noMargin>{thresholdDays}</Info2>
  )

  switch (config?.triggerType) {
    case 'txAmount':
      return (
        <Box display="flex" alignItems="baseline" justifyContent="right">
          {Threshold}
          <Label2 noMargin className={classes.lastSpace}>
            {currency}
          </Label2>
        </Box>
      )
    case 'txVolume':
      return (
        <Box display="flex" alignItems="baseline" justifyContent="right">
          {Threshold}
          <Label2 noMargin className={classes.lastSpace}>
            {currency}
          </Label2>
          <Label1 noMargin className={classes.space}>
            in
          </Label1>
          {ThresholdDays}
          <Label1 noMargin className={classes.lastSpace}>
            days
          </Label1>
        </Box>
      )
    case 'txVelocity':
      return (
        <Box display="flex" alignItems="baseline" justifyContent="right">
          {Threshold}
          <Label1 className={classes.space} noMargin>
            transactions in
          </Label1>
          {ThresholdDays}
          <Label1 className={classes.lastSpace} noMargin>
            days
          </Label1>
        </Box>
      )
    case 'consecutiveDays':
      return (
        <Box display="flex" alignItems="baseline" justifyContent="right">
          {ThresholdDays}
          <Label1 className={classes.lastSpace} noMargin>
            days
          </Label1>
        </Box>
      )
    default:
      return ''
  }
}

const ThresholdInput = memo(({ currency }) => {
  const { values } = useFormikContext()

  return <DisplayThreshold isEdit={true} config={values} currency={currency} />
})

const ThresholdView = ({ config, currency }) => {
  return <DisplayThreshold config={config} currency={currency} />
}

const getElements = (currency, classes, customInfoRequests) => [
  {
    name: 'triggerType',
    size: 'sm',
    width: 230,
    input: ({ field: { value: name } }) => (
      <>{getView(typeOptions, 'display')(name)}</>
    ),
    view: getView(typeOptions, 'display'),
    inputProps: {
      options: typeOptions,
      valueProp: 'code',
      labelProp: 'display',
      optionsLimit: null
    }
  },
  {
    name: 'requirement',
    size: 'sm',
    width: 230,
    bypassField: true,
    input: () => <RequirementInput customInfoRequests={customInfoRequests} />,
    view: it => (
      <RequirementView {...it} customInfoRequests={customInfoRequests} />
    )
  },
  {
    name: 'threshold',
    size: 'sm',
    width: 284,
    textAlign: 'right',
    input: () => <ThresholdInput currency={currency} />,
    view: (it, config) => <ThresholdView config={config} currency={currency} />
  }
  // {
  //   name: 'direction',
  //   size: 'sm',
  //   width: 282,
  //   view: it => <DirectionDisplay code={it} />,
  //   input: RadioGroup,
  //   inputProps: {
  //     labelClassName: classes.tableRadioLabel,
  //     className: classes.tableRadioGroup,
  //     options: directionOptions2
  //   }
  // }
]

const triggerOrder = R.map(R.prop('code'))(typeOptions)
const sortBy = [
  R.comparator(
    (a, b) =>
      triggerOrder.indexOf(a.triggerType) < triggerOrder.indexOf(b.triggerType)
  )
]

const fromServer = (triggers, customInfoRequests) => {
  return R.map(
    ({
      requirement,
      suspensionDays,
      threshold,
      thresholdDays,
      customInfoRequestId,
      ...rest
    }) => ({
      requirement: {
        requirement,
        suspensionDays,
        customInfoRequestId
      },
      threshold: {
        threshold,
        thresholdDays
      },
      ...rest
    })
  )(triggers)
}

const toServer = triggers =>
  R.map(({ requirement, threshold, ...rest }) => ({
    requirement: requirement.requirement,
    suspensionDays: requirement.suspensionDays,
    threshold: threshold.threshold,
    thresholdDays: threshold.thresholdDays,
    customInfoRequestId: requirement.customInfoRequestId,
    ...rest
  }))(triggers)

export {
  Schema,
  getElements,
  // txDirection,
  type,
  requirements,
  sortBy,
  fromServer,
  toServer,
  getView,
  requirementOptions
}
