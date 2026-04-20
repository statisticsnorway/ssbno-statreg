import './PageLayout.css'
import ssbLogo from '../assets/SSB_logo_black.svg'

import type { ReactNode } from 'react'

{/* TODO: This is only placeholder; create own Header component if necessary */}
const Header = () => (
  <div id="header">
    <div className="header-content container">
      <img src={ssbLogo} className="logo" alt="SSB logo"  />
      {/* TODO: Add links etc */}
    </div>
  </div>
)

const PageLayout = ({ children }: {children: ReactNode}) => {
  return (
    <>
      <Header />
      <main id="page-content">
        <div className='content container'>
          {children}
        </div>
      </main>
    </>
  )
}

export default PageLayout
