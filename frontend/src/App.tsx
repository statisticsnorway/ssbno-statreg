import { Routes, Route } from 'react-router'

import PageLayout from './layouts/PageLayout'
import ShowRelease from './views/ShowRelease'
import ShowStatistic from './views/ShowStatistic'
import Startpage from './views/Starpage'
import ListStatistics from './views/ListStatistics'
import ListReleases from './views/ListReleases'
import CreateRelease from './views/CreateRelease'
import CreateStatistic from './views/CreateStatistic'
import ListBlockedDates from './views/ListBlockedDates'
import CreateBlockedDate from './views/CreateBlockedDate'

function App() {
  return (
    <Routes>
      <Route path='' element={<PageLayout />}>
        <Route index element={<Startpage />} />

        <Route path='release' >
          <Route index element={<ListReleases />} />
          <Route path=':id' element={<ShowRelease />} />
          <Route path='create' element={<CreateRelease />} />
        </Route>

        <Route path='statistic' >
          <Route index element={<ListStatistics />} />
          <Route path=':shortname' element={<ShowStatistic />} />
          <Route path='create' element={<CreateStatistic />} />
        </Route>

        <Route path='blocked-dates' >
          <Route index element={<ListBlockedDates />} />
          <Route path='create' element={<CreateBlockedDate />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
