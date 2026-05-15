import { Routes, Route } from 'react-router'

import PageLayout from './layouts/PageLayout'
import ShowRelease from './views/ShowRelease'
import EditRelease from './views/EditRelease'
import ShowStatistic from './views/ShowStatistic'
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
        <Route index element={<ListReleases />} />

        <Route path='publisering'>
          <Route path=':id' element={<ShowRelease />} />
          <Route path=':id/rediger' element={<EditRelease />} />
        </Route>

        <Route path='statistikk'>
          <Route index element={<ListStatistics />} />
          <Route path=':shortname' element={<ShowStatistic />} />
          <Route path=':shortname/:variantId/opprett' element={<CreateRelease />} />
          <Route path='opprett' element={<CreateStatistic />} />
        </Route>

        <Route path='sperredato'>
          <Route index element={<ListBlockedDates />} />
          <Route path='opprett' element={<CreateBlockedDate />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
