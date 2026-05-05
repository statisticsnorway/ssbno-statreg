import './PageLayout.css'
import ssbLogo from '../assets/SSB_logo_black.svg'

import { Outlet } from 'react-router'
import { Link } from '@digdir/designsystemet-react'

{
  /* TODO: This is only placeholder; create own Header component if necessary */
}
const Header = () => (
  <div id='header'>
    <div className='header-content' data-color='brand1' data-size='sm'>
      <img src={ssbLogo} className='logo' alt='SSB logo' />
      <div className='header-links'>
        {/* TODO: Placeholder links */}
        <Link href='/statistikkregisteret/'>Publisering</Link>
        <Link href='/statistikkregisteret/statistikk/kpi'>Statistikk</Link>
      </div>
    </div>
  </div>
)

const PageLayout = () => {
  return (
    <>
      <Header />
      <main id='page-content' data-color='brand1' data-size='sm'>
        <div className='content'>
          <Outlet />
        </div>
      </main>
    </>
  )
}

export default PageLayout
