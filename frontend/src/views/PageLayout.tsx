import './PageLayout.css'
import ssbLogo from '../assets/SSB_logo_black.svg'

import { Outlet } from "react-router";

{/* TODO: This is only placeholder; create own Header component if necessary */}
const Header = () => (
  <div id="header">
    <div className="header-content">
      <img src={ssbLogo} className="logo" alt="SSB logo"  />
      {/* TODO: Add links etc */}
    </div>
  </div>
)

const PageLayout = () => {
  return (
    <>
      <Header />
      <main id="page-content" data-color='brand1'>
        <div className='content'>
        <Outlet />
        </div>
      </main>
    </>
  )
}

export default PageLayout
