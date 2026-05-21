import { useState, useEffect } from 'react'
import { type ReleaseListing } from '@ssbno-statreg/shared'
import { ReleasesTable } from '../components/ReleasesTable'

import client from '../api'

// TODO get releases for the chosen date
export function DateReleasesTable() {
  const [releases, setReleases] = useState<ReleaseListing[]>([])

  useEffect(() => {
    async function fetchReleases() {
      const { data, error } = await client.GET('/releases', { params: { query: { start: 0, count: 10 } } })
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setReleases(data?.releases ?? [])
      }
    }
    fetchReleases()
  }, [])

  return <ReleasesTable releases={releases} />
}
