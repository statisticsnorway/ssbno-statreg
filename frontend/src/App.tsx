import ReleaseDetail from './views/ReleaseDetail'
import StatisticDetail from './views/StatisticDetail'
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
