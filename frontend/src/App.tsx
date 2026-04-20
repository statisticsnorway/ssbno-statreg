import { Routes, Route } from "react-router";

import ReleaseDetail from './views/ReleaseDetail'
import StatisticDetail from './views/StatisticDetail'
import PageLayout from './views/PageLayout'
import Startpage from './views/Starpage';

function App() {
  return (
    <Routes>
      <Route path="" element={<PageLayout />} >
        <Route index element={<Startpage />} />

        <Route path="release" element={<ReleaseDetail />} />
        <Route path="statistic" element={<StatisticDetail />} />
        {/* Eventually we should do like this, when statisticList and statisticDeail is more ready! */}
        {/* <Route path="statistics" element={StatisticList} >
              <Route path=":shorname" element={StatisticDetails} >
            // StatisticDetail will get `params.shortname` as a paramenter from the router!
          </Route>
        </Route> */}
      </Route>
    </Routes>
  )
}

export default App
