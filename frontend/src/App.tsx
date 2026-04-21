import { Routes, Route } from 'react-router'

import ReleaseDetail from './views/ReleaseDetail'
import StatisticDetail from './views/StatisticDetail'
import PageLayout from './views/PageLayout'
import Startpage from './views/Starpage'

function App() {
  return (
    <Routes>
      <Route path="" element={<PageLayout />} >
        <Route index element={<Startpage />} />

        {/* TODO: Replace with ReleaseListing */}
        <Route path="release" element={<ReleaseDetail />}> 
          <Route path=":id" element={<ReleaseDetail />} />
        </Route>

        {/* TODO: Replace with StatisticListing */}
        <Route path="statistic" element={<StatisticDetail />}> 
          <Route path=":shortname" element={<StatisticDetail />}>
        </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default App
