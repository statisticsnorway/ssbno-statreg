import { useEffect, useState } from 'react'
import client from '../api'
import type { components } from '../../../shared/src/api-types'
import { Heading } from '@digdir/designsystemet-react'
import { Tag } from "@digdir/designsystemet-react";


type Release = components['schemas']['Release_details']

function ReleaseDetail() {
  const [release, setReleases] = useState<Release>({})

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
      <Heading level={2}>Publiseringsdato</Heading>
      <Heading level={3}>{format_datestring(release.publish_time)}</Heading>
      <Tag variant={'outline'} data-color={'danger'}>Ikke godkjent</Tag>
    </div> 
  )
}

export default ReleaseDetail

function format_datestring(dateString: string | undefined): string {
  if (!dateString) return ""
  const date = new Date(dateString)
  
  const formatted = new Intl.DateTimeFormat("no-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date).replace(",", " kl");

  return formatted
}