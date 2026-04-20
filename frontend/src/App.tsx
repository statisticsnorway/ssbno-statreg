import { Heading } from '@digdir/designsystemet-react'

import ReleaseDetail from './views/releaseDetail'
import StatisticDetail from './views/statisticDetail'

function App() {
  return <>
  <Heading level={1} data-size="xl">Statreg</Heading>
  <hr />
  <ReleaseDetail></ReleaseDetail>
  <hr />
  <StatisticDetail></StatisticDetail>
  </>
}
export default App
