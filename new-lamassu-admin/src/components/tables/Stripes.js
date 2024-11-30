import React from 'react'
import StripesSvg from 'src/styling/icons/stripes.svg?react'

import { Td } from 'src/components/fake-table/Table'

const Stripes = ({ width }) => (
  <Td width={width}>
    <StripesSvg />
  </Td>
)

export default Stripes
