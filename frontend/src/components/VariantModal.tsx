import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
import { Button, Heading, Dialog, Field, Label, Input, Select, Paragraph } from '@statisticsnorway/design-react'
import { TrashIcon } from '@navikt/aksel-icons'

import './VariantModal.css'
import client from '../api'
import { RevisionNames, type Frequency, type Variant } from '@ssbno-statreg/shared'
import { ErrorAlert } from './ErrorAlert'

type VariantModalProps = {
  openVariantModal: boolean
  setOpenVariantModal: (open: boolean) => void
  setCreatedVariants: Dispatch<SetStateAction<Variant[]>>
  editVariantValues?: Variant
  editVariantIndex?: number | null
}

type CreateVariantFormValues = {
  revision_code: string
  frequency_code: string
  level_of_detail_name: string
  level_of_detail_name_en: string
}

export function VariantModal({
  openVariantModal,
  setOpenVariantModal,
  setCreatedVariants,
  editVariantValues,
  editVariantIndex,
}: Readonly<VariantModalProps>) {
  const [frequencies, setFrequencies] = useState<Frequency[]>([])
  const [apiError, setApiError] = useState<string[]>([])
  const [values, setValues] = useState<CreateVariantFormValues>({
    revision_code: editVariantValues?.revision?.code ?? 'I',
    frequency_code: editVariantValues?.frequency?.code ?? 'U',
    level_of_detail_name: editVariantValues?.level_of_detail?.name ?? '',
    level_of_detail_name_en: editVariantValues?.level_of_detail?.name_en ?? '',
  })

  const isEditMode = typeof editVariantIndex === 'number'
  const revisionSelectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (openVariantModal) revisionSelectRef.current?.focus()
  }, [openVariantModal])

  useEffect(() => {
    async function fetchFrequencies() {
      const { data, error } = await client.GET('/frequencies')
      if (error) {
        setApiError((prev) => [...prev, error.message])
        return
      }
      setFrequencies(data)
    }
    fetchFrequencies()
  }, [])

  function createVariant() {
    const selectedFrequency = frequencies.find(({ code }) => code === values.frequency_code)

    setCreatedVariants((prevVariants: Variant[]) => {
      const nextVariant: Variant = {
        revision: {
          code: values.revision_code,
        },
        frequency: selectedFrequency,
        level_of_detail: {
          name: values.level_of_detail_name,
          name_en: values.level_of_detail_name_en,
        },
      }

      if (!isEditMode) {
        return [...prevVariants, nextVariant]
      }

      return prevVariants.map((variant, index) => (index === editVariantIndex ? nextVariant : variant))
    })
    handleCloseModal()
  }

  function deleteVariant() {
    if (!isEditMode) return

    setCreatedVariants((prevVariants: Variant[]) => prevVariants.filter((_, index) => index !== editVariantIndex))
    handleCloseModal()
  }

  function handleCloseModal() {
    setOpenVariantModal(false)
  }

  return (
    <Dialog
      id='variant-modal'
      aria-labelledby='variant-modal-heading'
      aria-describedby='variant-modal-description'
      open={openVariantModal}
      onClose={handleCloseModal}
    >
      <Dialog.Block>
        <Heading id='variant-modal-heading' data-size='xs'>
          {isEditMode ? 'Rediger variant' : 'Legg til variant'}
        </Heading>
      </Dialog.Block>
      <Dialog.Block className='variant-modal-form'>
        {apiError.length > 0 && <ErrorAlert message={apiError} />}
        <Paragraph id='variant-modal-description'>
          En variant definerer frekvens og detaljnivå for statistikken. Du trenger minst én variant for å kunne melde
          publiseringsdato.
        </Paragraph>
        <Field>
          <Label>Revisjon</Label>
          <Select
            ref={revisionSelectRef}
            aria-describedby='variant-modal-description'
            aria-label='Revisjon'
            value={values.revision_code}
            onChange={(e) => setValues((prevValues) => ({ ...prevValues, revision_code: e.target.value }))}
          >
            {Object.entries(RevisionNames).map(([code, name]) => (
              <Select.Option key={`revision-${code}`} value={code}>
                {name}
              </Select.Option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label>Frekvens</Label>
          <Select
            value={values.frequency_code}
            onChange={(e) => setValues((prevValues) => ({ ...prevValues, frequency_code: e.target.value }))}
          >
            {frequencies.map(({ code, name }) => (
              <Select.Option key={`frequency-${code}`} value={code}>
                {name}
              </Select.Option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label>Detaljnivå</Label>
          <Field.Description>Nivået på detaljene i publiserte data</Field.Description>
          <Input
            value={values.level_of_detail_name}
            onChange={(e) => setValues((prevValues) => ({ ...prevValues, level_of_detail_name: e.target.value }))}
          />
        </Field>
        <Field>
          <Label>Detaljnivå på engelsk</Label>
          <Input
            value={values.level_of_detail_name_en}
            onChange={(e) => setValues((prevValues) => ({ ...prevValues, level_of_detail_name_en: e.target.value }))}
          />
        </Field>
        <div className='variant-modal-form-buttons'>
          <div className='variant-modal-form-buttons-left'>
            <Button variant='primary' onClick={createVariant}>
              Legg til
            </Button>
            <Button variant='tertiary' onClick={handleCloseModal}>
              Avbryt
            </Button>
          </div>
          {isEditMode && (
            <Button variant='tertiary' data-color='danger' onClick={deleteVariant}>
              <TrashIcon /> Slett
            </Button>
          )}
        </div>
      </Dialog.Block>
    </Dialog>
  )
}
