import { Outlet } from "react-router";
import ssbLogo from '../assets/SSB_logo_black.svg'
import { Divider } from '@digdir/designsystemet-react'

function Header() {
  return (
    <div id="header">
      <div className="header-content">
        <img src={ssbLogo} className="logo" alt="SSB logo" />
      </div>
      <Divider />
      <Outlet />
    </div>
  )

}
export default Header 