import { Routes, Route } from 'react-router'

import PageLayout from './layouts/PageLayout'
import ShowRelease from './views/ShowRelease'
import ReleaseForm from './views/ReleaseForm'
import ShowStatistic from './views/ShowStatistic'
import ListStatistics from './views/ListStatistics'
import ListReleases from './views/ListReleases'
import CreateStatistic from './views/CreateStatistic'
import EditStatistic from './views/EditStatistic'
import ListBlockedDates from './views/ListBlockedDates'
import CreateBlockedDate from './views/CreateBlockedDate'
import Tasks from './views/Tasks'
import StatisticVersions from './views/StatisticVersions'

function App() {
  return (
    <Routes>
      <Route path='' element={<PageLayout />}>
        <Route index element={<ListReleases />} />

        <Route path='publisering'>
          <Route path=':id' element={<ShowRelease />} />
          <Route path=':id/rediger' element={<ReleaseForm />} />
        </Route>

        <Route path='statistikk'>
          <Route index element={<ListStatistics />} />
          <Route path=':shortname' element={<ShowStatistic />} />
          <Route path=':shortname/versions' element={<StatisticVersions />} />
          <Route path=':shortname/:variantId/opprett' element={<ReleaseForm />} />
          <Route path=':shortname/rediger' element={<EditStatistic />} />
          <Route path='opprett' element={<CreateStatistic />} />
        </Route>

        <Route path='sperredato'>
          <Route index element={<ListBlockedDates />} />
          <Route path='opprett' element={<CreateBlockedDate />} />
        </Route>

        <Route path='oppgaver' element={<Tasks />} />
      </Route>
    </Routes>
  )
}

export default App
