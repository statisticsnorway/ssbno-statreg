import './App.css'
import ReleaseDetail from './views/releaseDetail'
import StatisticDetail from './views/statisticDetail'

import { Heading } from '@digdir/designsystemet-react'

{/* TODO: This is only placeholder; create own Header component if necessary */}
const Header = () => (
  <div id="header">
    <div className="header-content">
      <Heading level={1} data-size="md">Statistisk sentralbyrå</Heading>
    </div>
  </div>
)

function App() {
  return (
    <>
      <Header />
      <main id="page-content">
        <div className='content' data-color='brand1'>
          <ReleaseDetail></ReleaseDetail>
          <hr />
          <StatisticDetail></StatisticDetail>
        </div>
      </main>
    </>
  )
}

export default App
