import { useQuery } from '@apollo/react-hooks'
import Breadcrumbs from '@material-ui/core/Breadcrumbs'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import NavigateNextIcon from '@material-ui/icons/NavigateNext'
import classnames from 'classnames'
import gql from 'graphql-tag'
import * as R from 'ramda'
import React from 'react'
import { Link, useLocation } from 'react-router-dom'

import { TL1, TL2, Label3 } from 'src/components/typography'

import Cassettes from './MachineComponents/Cassettes'
import Commissions from './MachineComponents/Commissions'
import Details from './MachineComponents/Details'
import Overview from './MachineComponents/Overview'
import Transactions from './MachineComponents/Transactions'
import styles from './Machines.styles'
const useStyles = makeStyles(styles)

const GET_INFO = gql`
  query getMachine($deviceId: ID!) {
    machine(deviceId: $deviceId) {
      name
      deviceId
      paired
      lastPing
      pairedAt
      version
      model
      cashbox
      cassette1
      cassette2
      cassette3
      cassette4
      numberOfCassettes
      statuses {
        label
        type
      }
      downloadSpeed
      responseTime
      packetLoss
      latestEvent {
        note
      }
    }
    config
  }
`

const getMachineID = path => path.slice(path.lastIndexOf('/') + 1)

const Machines = () => {
  const location = useLocation()
  const { data, loading, refetch } = useQuery(GET_INFO, {
    variables: {
      deviceId: getMachineID(location.pathname)
    }
  })
  const classes = useStyles()

  const timezone = R.path(['config', 'locale_timezone'], data) ?? {}

  const machine = R.path(['machine'])(data) ?? {}
  const config = R.path(['config'])(data) ?? {}

  const machineName = R.path(['name'])(machine) ?? null
  const machineID = R.path(['deviceId'])(machine) ?? null

  return (
    !loading && (
      <Grid container className={classes.grid}>
        <Grid item xs={3}>
          <Grid item xs={12}>
            <div className={classes.breadcrumbsContainer}>
              <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
                <Link to="/dashboard" className={classes.breadcrumbLink}>
                  <Label3 noMargin className={classes.subtitle}>
                    Dashboard
                  </Label3>
                </Link>
                <TL2 noMargin className={classes.subtitle}>
                  {machineName}
                </TL2>
              </Breadcrumbs>
              <Overview data={machine} onActionSuccess={refetch} />
            </div>
          </Grid>
        </Grid>
        <Grid item xs={9}>
          <div className={classes.content}>
            <div
              className={classnames(classes.detailItem, classes.detailsMargin)}>
              <TL1 className={classes.subtitle}>{'Details'}</TL1>
              <Details data={machine} timezone={timezone} />
            </div>
            <div className={classes.detailItem}>
              <TL1 className={classes.subtitle}>{'Cash box & cassettes'}</TL1>
              <Cassettes
                refetchData={refetch}
                machine={machine}
                config={config ?? false}
              />
            </div>
            <div className={classes.transactionsItem}>
              <TL1 className={classes.subtitle}>{'Latest transactions'}</TL1>
              <Transactions id={machineID} />
            </div>
            <div className={classes.detailItem}>
              <TL1 className={classes.subtitle}>{'Commissions'}</TL1>
              <Commissions name={'commissions'} id={machineID} />
            </div>
          </div>
        </Grid>
      </Grid>
    )
  )
}

export default Machines
