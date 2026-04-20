import './PageLayout.css'
import ssbLogo from '../assets/SSB_logo_black.svg'

import type { ReactNode } from 'react'

{/* TODO: This is only placeholder; create own Header component if necessary */}
const Header = () => (
  <div id="header">
    <div className="header-content">
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
        <div className='content' data-color='brand1'>
          {children}
        </div>
      </main>
    </>
  )
}

export default PageLayout
