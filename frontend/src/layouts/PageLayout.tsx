import './PageLayout.css'
import ssbLogo from '../assets/SSB_logo_black.svg'

import { Outlet } from 'react-router'
import { Link, Button, Avatar } from '@digdir/designsystemet-react'
import { useAuth } from '../context/AuthContext'

{
  /* TODO: This is only placeholder; create own Header component if necessary */
}
const Header = () => {
  const { auth } = useAuth()
  const initials = auth?.email?.split('@')[0]

  return (
    <div id='header'>
      <div className='header-content' data-color='brand1' data-size='sm'>
        <img src={ssbLogo} className='logo' alt='SSB logo' />
        <div className='header-links'>
          <Link href='/statistikkregisteret/'>Publisering</Link>
          <Link href='/statistikkregisteret/statistikk'>Statistikker</Link>
          {auth?.isAdmin && (
            <Button variant='tertiary' onClick={() => alert('Kommer senere')}>
              Mine saker <Avatar aria-label={auth?.fullName ?? ''} initials={initials} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

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
