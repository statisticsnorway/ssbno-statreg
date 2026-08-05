import { useState } from 'react'
import { Button, Heading, Dialog, Field, Label, Input, Select } from '@digdir/designsystemet-react'

import { RevisionNames, FrequencyNames, type Variant } from '@ssbno-statreg/shared'
import { ErrorAlert } from '../components/ErrorAlert'

type CreateVariantModalProps = {
  openCreateVariantModal: boolean
  setOpenCreateVariantModal: (open: boolean) => void
  setCreatedVariant: (variant: Variant) => void
}

type CreateVariantFormValues = {
  revision_code: string
  frequency_code: string
  level_of_detail_name: string
  level_of_detail_name_en: string
}

export function CreateVariantModal({
  openCreateVariantModal,
  setOpenCreateVariantModal,
  setCreatedVariant,
}: Readonly<CreateVariantModalProps>) {
  const [values, setValues] = useState<CreateVariantFormValues>({
    revision_code: 'I',
    frequency_code: 'U',
    level_of_detail_name: '',
    level_of_detail_name_en: '',
  })
  const [apiError, setApiError] = useState<string[]>([])

  // TODO: Form submition
  async function createVariant() {
    setCreatedVariant({
      revision: { code: values.revision_code },
      frequency: { code: values.frequency_code },
      level_of_detail: {
        name: values.level_of_detail_name,
        name_en: values.level_of_detail_name_en,
      },
    })
    setApiError([])
  }

  function handleOnSubmit(e: React.ChangeEvent<HTMLFormElement>) {
    e.preventDefault()
    createVariant()
  }

  function handleCloseModal() {
    setOpenCreateVariantModal(false)
  }

  return (
    <Dialog id='create-variant-modal' open={openCreateVariantModal} onClose={handleCloseModal}>
      <Dialog.Block>
        <Heading data-size='xs'>Legg til variant</Heading>
      </Dialog.Block>
      <Dialog.Block>
        {apiError.length > 0 && <ErrorAlert message={apiError} />}
        <form onSubmit={handleOnSubmit}>
          <Field>
            <Label>Revisjon</Label>
            <Select
              value={values.revision_code}
              onChange={(e) => setValues((prevValues) => ({ ...prevValues, revision_code: e.target.value }))}
            >
              {Object.entries(RevisionNames).map(([code, name]) => (
                <Select.Option key={`revision-${code}`} value={code}>
                  {name} ({code})
                </Select.Option>
              ))}
            </Select>
          </Field>
          {/* TODO: Fetch frequency from api */}
          <Field>
            <Label>Frekvens</Label>
            <Select
              value={values.frequency_code}
              onChange={(e) => setValues((prevValues) => ({ ...prevValues, frequency_code: e.target.value }))}
            >
              {Object.entries(FrequencyNames).map(([code, name]) => (
                <Select.Option key={`frequency-${code}`} value={code}>
                  {name} ({code})
                </Select.Option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label>Detaljnivå</Label>
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
          <div style={{ display: 'flex', marginTop: 'var(--ds-size-3)' }}>
            <Button variant='primary' type='submit'>
              Legg til
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
