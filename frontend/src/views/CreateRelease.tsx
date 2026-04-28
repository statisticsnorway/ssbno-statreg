import { useEffect, useState } from 'react'
import { Heading, } from '@digdir/designsystemet-react'
import { type ReleaseDetails } from '@ssbno-statreg/shared'
import client from '../api'

export default function CreateRelease() {
  const [releases, setReleases] = useState<ReleaseDetails>({})

  useEffect(() => {
    async function fetchRelease() {
      const { data, error } = await client.GET('/statistics/{shortname}/variants/{id}/releases', { params: { path: { shortname: 'utlaerling', id: 9024 } } })
      if (error) {
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setReleases(data)
      }
    }
    fetchRelease()
  }, [])


  return (
    <>
      <Heading level={1} data-size='sm'>Meld publiseringsdato</Heading>
      {console.log(releases)}
    </>
  )
}