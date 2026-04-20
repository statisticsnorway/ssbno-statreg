import './App.css'

import { Heading, Paragraph } from '@digdir/designsystemet-react'

function App() {
  return (
    <>
      {/* TODO: This is a placeholder; create own Header component */}
      <div id="header">
        <div className="header-content">
          <Heading level={1} data-size="lg">Statistisk sentralbyrå</Heading>
        </div>
      </div>

      <section id="content">
        <div className=''>
          {/* TODO: Add components */}
          <Paragraph>Lorem ipsum dolor sit amet</Paragraph>
        </div>
      </section>
    </>
  )
}

export default App
