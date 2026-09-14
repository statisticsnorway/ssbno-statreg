import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, Heading, Dialog, Field, Input, Paragraph, ValidationMessage } from '@statisticsnorway/design-react'

import client from '../api'
import { useAuth } from '../context/AuthContext'
import { ErrorAlert } from '../components/ErrorAlert'

type CreateShortnameModalProps = {
  openCreateShortnameModal: boolean
}

export function CreateShortnameModal({ openCreateShortnameModal }: Readonly<CreateShortnameModalProps>) {
  const { auth } = useAuth()

  const [apiError, setApiError] = useState<string[]>([])

  const [validationError, setValidationError] = useState('')
  const [shortnameInput, setShortnameInput] = useState('')
  const [lastCheckedShortname, setLastCheckedShortname] = useState<string | null>(null)
  const [isAvailable, setIsAvailable] = useState(false)

  const navigate = useNavigate()
  const isAdmin = auth?.isAdmin ?? false
  const latestInputRef = useRef('')

  useEffect(() => {
    const formatError = validateShortnameFormat(shortnameInput)

    if (!isAdmin || !shortnameInput || formatError) return

    const controller = new AbortController()
    const currentShortname = shortnameInput

    async function checkShortname() {
      const { error, response } = await client.GET('/shortnames/{shortname}', {
        params: { path: { shortname: currentShortname } },
        signal: controller.signal,
      })

      if (controller.signal.aborted || latestInputRef.current !== currentShortname) {
        return
      }

      if (!error) {
        setValidationError('Dette kortnavnet er ikke ledig')
        setLastCheckedShortname(currentShortname)
        setIsAvailable(false)
        return
      }

      if (response.status === 404) {
        setLastCheckedShortname(currentShortname)
        setValidationError('')
        setIsAvailable(true)
        return
      }

      setApiError([error.message])
      setLastCheckedShortname(null)
      setIsAvailable(false)
    }

    void checkShortname()

    return () => {
      controller.abort()
    }
  }, [isAdmin, shortnameInput])

  function validateShortnameFormat(value: string) {
    if (!value) {
      return 'Fyll ut et kortnavn'
    }

    const invalidShortnameCharacters = value.match(/[^a-z_]/g)
    if (invalidShortnameCharacters) {
      const invalidChars = [...new Set(invalidShortnameCharacters)]
      return `Kortnavnet inneholder ugyldige tegn: ${invalidChars.join(', ')}`
    }

    return ''
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setApiError([])
    setShortnameInput(value)
    latestInputRef.current = value
    const formatError = validateShortnameFormat(value)
    setValidationError(formatError)
    setLastCheckedShortname(null)
    setIsAvailable(false)
  }

  async function createShortname() {
    const { data, error } = await client.POST('/shortnames', {
      body: {
        shortname: shortnameInput,
      },
    })
    if (error) {
      setApiError((prev) => [...prev, error.message])
      return
    }
    navigate(`/statistikk/${data.shortname}/opprett`)
  }

  function handleOnSubmit(e: React.ChangeEvent<HTMLFormElement>) {
    e.preventDefault()

    const formatError = validateShortnameFormat(shortnameInput)
    if (formatError) {
      setValidationError(formatError)
      return
    }

    if (lastCheckedShortname !== shortnameInput || !isAvailable) {
      setValidationError('Dette kortnavnet er ikke ledig')
      return
    }

    createShortname()
  }

  function handleCloseModal() {
    navigate('/statistikk', { state: { returnFocusToCreateStatisticButton: true } })
  }

  return (
    <Dialog
      id='create-shortname-modal'
      aria-labelledby='create-shortname-modal-heading'
      open={openCreateShortnameModal}
      onClose={handleCloseModal}
      closedby='any'
    >
      <Dialog.Block>
        <Heading id='create-shortname-modal-heading' data-size='xs'>
          Opprett kortnavn for statistikken
        </Heading>
      </Dialog.Block>
      <Dialog.Block>
        {apiError.length > 0 && <ErrorAlert message={apiError} />}
        <form onSubmit={handleOnSubmit}>
          <Field>
            <Field.Description>
              Du må registrere et kortnavn før du kan fylle ut resten av informasjonen om statistikken. Kortnavnet kan
              ikke endres etter at statistikken har blitt opprettet. Maks 14 tegn, kun små bokstaver og understrek er
              lov.
            </Field.Description>
            <Input
              aria-invalid={!!validationError}
              onChange={handleInputChange}
              maxLength={14}
              // @ts-expect-error native "autofocus" is not part of the React types
              autofocus='true'
            />
            <Paragraph data-limit='14' data-field='counter' />
            {validationError ? (
              <ValidationMessage data-field='validation'>{validationError}</ValidationMessage>
            ) : (
              lastCheckedShortname === shortnameInput &&
              isAvailable && (
                <ValidationMessage data-field='validation' data-color='success'>
                  Kortnavn er ledig
                </ValidationMessage>
              )
            )}
          </Field>
          <div style={{ display: 'flex', gap: 'var(--ds-size-2)', marginTop: 'var(--ds-size-3)' }}>
            <Button variant='primary' type='submit'>
              Opprett kortnavn
            </Button>
            <Button variant='tertiary' onClick={handleCloseModal}>
              Avbryt
            </Button>
          </div>
        </form>
      </Dialog.Block>
    </Dialog>
  )
}
