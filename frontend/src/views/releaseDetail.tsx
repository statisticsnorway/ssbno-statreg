import { useEffect, useState } from 'react'
import client from '../api'
import type { ReleaseDetails } from '@ssbno-statreg/shared'

function ReleaseDetail() {
  const [release, setReleases] = useState<ReleaseDetails>({})

  useEffect(() => {
    async function fetchRelease() {
      const { data, error } = await client.GET('/releases/{id}', { params: { path: { id: '1' } } })
      if (error) {
        console.log(error)
        alert(error)
      } else {
        setReleases(data)
      }
    }
    fetchRelease()
  }, [])

  return (
    <div>
      <h1>Release {release.id}</h1>
      <ul>
        <li>From {release.period_from}</li>
        <li>To {release.period_to}</li>
      </ul>
    </div>
  )
}

export default ReleaseDetail
