import { useState, useEffect, type Dispatch, type SetStateAction } from 'react'
import { Button, Heading, Dialog, Field, Label, Input, Select, Paragraph } from '@digdir/designsystemet-react'
import { TrashIcon } from '@navikt/aksel-icons'

import './CreateVariantModal.css'
import client from '../api'
import { RevisionNames, type Frequency, type Variant } from '@ssbno-statreg/shared'
import { ErrorAlert } from '../components/ErrorAlert'

type CreateVariantModalProps = {
  openCreateVariantModal: boolean
  setOpenCreateVariantModal: (open: boolean) => void
  setCreatedVariants: Dispatch<SetStateAction<Variant[]>>
  variantToEdit?: Variant
  editVariantIndex?: number | null
}

type CreateVariantFormValues = {
  revision_code: string
  frequency_code: string
  level_of_detail_name: string
  level_of_detail_name_en: string
}

function getVariantFormValues(variantToEdit?: Variant): CreateVariantFormValues {
  return {
    revision_code: variantToEdit?.revision?.code ?? 'I',
    frequency_code: variantToEdit?.frequency?.code ?? 'U',
    level_of_detail_name: variantToEdit?.level_of_detail?.name ?? '',
    level_of_detail_name_en: variantToEdit?.level_of_detail?.name_en ?? '',
  }
}

export function CreateVariantModal({
  openCreateVariantModal,
  setOpenCreateVariantModal,
  setCreatedVariants,
  variantToEdit,
  editVariantIndex,
}: Readonly<CreateVariantModalProps>) {
  const [frequencies, setFrequencies] = useState<Frequency[]>([])
  const [apiError, setApiError] = useState<string[]>([])
  const [values, setValues] = useState<CreateVariantFormValues>(() => getVariantFormValues(variantToEdit))

  const isEditMode = typeof editVariantIndex === 'number'

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
    setOpenCreateVariantModal(false)
  }

  return (
    <Dialog id='create-variant-modal' open={openCreateVariantModal} onClose={handleCloseModal}>
      <Dialog.Block>
        <Heading data-size='xs'>{isEditMode ? 'Rediger variant' : 'Legg til variant'}</Heading>
      </Dialog.Block>
      <Dialog.Block className='create-variant-modal-form'>
        {apiError.length > 0 && <ErrorAlert message={apiError} />}
        <Paragraph>
          En variant definerer frekvens og detaljnivå for statistikken. Du trenger minst én variant for å kunne melde
          publiseringsdato.
        </Paragraph>
        <Field>
          <Label>Revisjon</Label>
          <Select
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
        <div className='create-variant-modal-form-buttons'>
          <div className='create-variant-modal-form-buttons-left'>
            <Button variant='primary' onClick={createVariant}>
              Legg til
            </Button>
            <Button variant='tertiary' onClick={handleCloseModal}>
              Avbryt
            </Button>
          </div>
          {isEditMode && (
            <Button variant='secondary' data-color='danger' onClick={deleteVariant}>
              <TrashIcon /> Slett
            </Button>
          )}
        </div>
      </Dialog.Block>
    </Dialog>
  )
}
