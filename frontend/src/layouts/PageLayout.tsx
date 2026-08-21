import './PageLayout.css'
import ssbLogo from '../assets/SSB_logo_black.svg'

import { Outlet, Link as ReactRouterLink } from 'react-router'
import { Link, Button, Avatar } from '@statisticsnorway/design-react'
import { useAuth } from '../context/AuthContext'

const Header = () => {
  const { auth } = useAuth()
  const firstNameLetter = auth?.fullName?.charAt(0)

  function renderAvatar() {
    return <Avatar aria-label={auth?.fullName ?? ''} initials={firstNameLetter} />
  }

  return (
    <div id='header'>
      <div className='header-content' data-color='brand1' data-size='sm'>
        <img src={ssbLogo} className='logo' alt='SSB logo' />
        <div className='header-links'>
          <Link href='/statistikkregisteret/'>Publisering</Link>
          <Link href='/statistikkregisteret/statistikk'>Statistikker</Link>
          {auth?.isAdmin ? (
            <Button variant='tertiary' asChild>
              <ReactRouterLink to='/oppgaver' reloadDocument>
                Oppgaver {renderAvatar()}
              </ReactRouterLink>
            </Button>
          ) : (
            <div className='header-user-info'>
              {auth?.email?.split('@')[0] ?? ''}
              {renderAvatar()}
            </div>
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
