import './App.css'
import ReleaseDetail from './views/ReleaseDetail'
import StatisticDetail from './views/StatisticDetail'
import ssbLogo from './assets/SSB_logo_black.svg'

import { Divider } from '@digdir/designsystemet-react'

{/* TODO: This is only placeholder; create own Header component if necessary */}
const Header = () => (
  <div id="header">
    <div className="header-content">
      <img src={ssbLogo} className="logo" alt="SSB logo"  />
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
          <Divider />
          <StatisticDetail></StatisticDetail>
        </div>
      </main>
    </>
  )
}

export default App
