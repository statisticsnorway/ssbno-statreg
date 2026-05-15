import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Heading } from '@digdir/designsystemet-react'
import { type ReleaseUpdate, type ReleaseDetails } from '@ssbno-statreg/shared'

import { ReleaseForm } from '../components/ReleaseForm'

import client from '../api'

function EditRelease() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [release, setRelease] = useState<ReleaseDetails>({})

  useEffect(() => {
    async function fetchRelease() {
      const { data, error } = await client.GET('/releases/{id}', { params: { path: { id: id as string } } })
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (error as any).error
        console.log(errorMessage)
        alert(errorMessage)
      } else {
        setRelease(data)
      }
    }
    fetchRelease()
  }, [id])

  async function updateRelease(body: ReleaseUpdate) {
    const { data, error } = await client.PUT('/releases/{id}', {
      params: { path: { id: id as string } },
      body,
    })

    if (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (error as any).error
      console.log(errorMessage)
      alert(errorMessage)
    } else {
      navigate(`/publisering/${data?.id}`)
    }
  }

  const shortname = release.statistic?.shortname ?? ''

  return (
    <>
      <div>
        <Heading level={1} data-size='md'>
          Rediger publiseringsdato
        </Heading>
      </div>
      {release.id && <ReleaseForm onFormSubmit={updateRelease} shortname={shortname} initialValues={release} />}
    </>
  )
}

export default EditRelease
