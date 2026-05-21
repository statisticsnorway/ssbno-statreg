import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Heading } from '@digdir/designsystemet-react'
import { type ReleaseUpdate, type ReleaseDetails } from '@ssbno-statreg/shared'
import { ApprovalStatusTag } from '../components/ApprovalStatus'
import { ReleaseForm } from '../components/ReleaseForm'
import { RelatedReleasesTables } from './RelatedReleasesTables'

import client from '../api'

export default function EditRelease() {
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

  const shortname = release.statistic?.shortname
  const statisticShortname = release.statistic?.shortname
  const frequency = release.variant?.frequency?.name?.toLowerCase()
  const approvalStatus = release.approval_status
  const variantId = release.variant?.id

  return (
    <>
      <div>
        <Heading level={1} data-size='md'>
          Rediger publiseringsdato
        </Heading>
        <Heading data-size='xs' level={2}>
          {shortname} ({statisticShortname}) og {frequency}
        </Heading>
        <ApprovalStatusTag status={approvalStatus} />
      </div>
      {statisticShortname && release && (
        <ReleaseForm onFormSubmit={updateRelease} shortname={statisticShortname} initialValues={release} />
      )}
      {shortname && variantId && (
        <RelatedReleasesTables
          shortname={shortname}
          date='' //TODO get chosen date
          variantId={variantId}
        />
      )}
    </>
  )
}
