import ReleaseDetail from './views/releaseDetail'
import StatisticDetail from './views/statisticDetail'
import PageLayout from './views/PageLayout'

import { Divider } from '@digdir/designsystemet-react'

function App() {
  return (
    <PageLayout>
      <ReleaseDetail></ReleaseDetail>
      <Divider />
      <StatisticDetail></StatisticDetail>
    </PageLayout>
  )
}

export default App
