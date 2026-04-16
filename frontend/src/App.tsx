import { useEffect, useState } from 'react'
import client from './api'
import type { components } from '../../shared/api-types'

type Release = components['schemas']['Release_listing'] 

function App() {
  const [releases, setReleases] = useState<Release[]>([])

  useEffect(() => {
    async function fetchReleases() {
      const { data, error } = await client.GET('/releases')
      if (error) {
        // TODO handle error
      } else {
        setReleases(data)
      }
    }
    fetchReleases()
  }, [])

  return (
    <div>
      <h1>Releases</h1>
      <ul>
        {releases.map((release) => (
          <li key={release.id}>{release.period_from} - {release.period_to}</li>
        ))}
      </ul>
    </div>
  )
}

export default App
