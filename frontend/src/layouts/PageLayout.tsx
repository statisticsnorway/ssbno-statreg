import './PageLayout.css'
import ssbLogo from '../assets/SSB_logo_black.svg'

import { Outlet } from 'react-router'
import { Link, Button, Avatar } from '@digdir/designsystemet-react'
import { useAuth } from '../context/AuthContext'

const Header = () => {
  const { auth } = useAuth()
  const firstNameLetter = auth?.fullName?.charAt(0)

  return (
    <div id='header'>
      <div className='header-content' data-color='brand1' data-size='sm'>
        <img src={ssbLogo} className='logo' alt='SSB logo' />
        <div className='header-links'>
          <Link href='/statistikkregisteret/'>Publisering</Link>
          <Link href='/statistikkregisteret/statistikk'>Statistikker</Link>
          {auth?.isAdmin && (
            <Button variant='tertiary' onClick={() => alert('Kommer senere')}>
              Mine saker <Avatar aria-label={auth?.fullName ?? ''} initials={firstNameLetter} />
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
