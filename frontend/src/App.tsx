import { Routes, Route } from 'react-router'

import ReleaseDetail from './views/ReleaseDetail'
import StatisticDetail from './views/StatisticDetail'
import PageLayout from './views/PageLayout'
import ReleaseListing from './views/ReleaseListing'

function App() {
  return (
    <Routes>
      <Route path='' element={<PageLayout />}>
        <Route index element={<ReleaseListing />} />

        <Route path='release'> {/* TODO: Double check /release page, and consider changing path to norwegian */}
          <Route path=':id' element={<ReleaseDetail />} />
        </Route>

        {/* TODO: Replace with StatisticListing */}
        <Route path='statistic' element={<StatisticDetail />}>
          <Route path=':shortname' element={<StatisticDetail />}/>
        </Route>
      </Route>
    </Routes>
  )
}

export default App
