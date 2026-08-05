import { useState, type Dispatch, type SetStateAction } from 'react'
import { Button, Heading, Dialog, Field, Label, Input, Select, Paragraph } from '@digdir/designsystemet-react'

import './CreateVariantModal.css'
import { RevisionNames, type Variant } from '@ssbno-statreg/shared'

type CreateVariantModalProps = {
  openCreateVariantModal: boolean
  setOpenCreateVariantModal: (open: boolean) => void
  setCreatedVariants: Dispatch<SetStateAction<Variant[]>>
}

type CreateVariantFormValues = {
  revision_code: string
  frequency_code: string
  level_of_detail_name: string
  level_of_detail_name_en: string
}

// TODO: MIM-2980: Fetch from backend/api
export const FrequencyNames = {
  U: 'Uke',
  M: 'Måned',
  K: 'Kvartal',
  H: 'Halvår',
  A: 'År',
  '2A': 'Hvert 2 år',
  '3A': 'Hvert 3 år',
  '4A': 'Hvert 4 år',
  '5A': 'Hvert 5 år',
  '10A': 'Hvert 10 år',
  T: 'Termin',
} as const

export function CreateVariantModal({
  openCreateVariantModal,
  setOpenCreateVariantModal,
  setCreatedVariants,
}: Readonly<CreateVariantModalProps>) {
  const [values, setValues] = useState<CreateVariantFormValues>({
    revision_code: 'I',
    frequency_code: 'U',
    level_of_detail_name: '',
    level_of_detail_name_en: '',
  })

  function createVariant() {
    setCreatedVariants((prevVariants: Variant[]) => [
      ...prevVariants,
      {
        revision: { code: values.revision_code },
        frequency: { code: values.frequency_code },
        level_of_detail: {
          name: values.level_of_detail_name,
          name_en: values.level_of_detail_name_en,
        },
      },
    ])
    handleCloseModal()
  }

  function handleCloseModal() {
    setOpenCreateVariantModal(false)
  }

  return (
    <Dialog id='create-variant-modal' open={openCreateVariantModal} onClose={handleCloseModal}>
      <Dialog.Block>
        <Heading data-size='xs'>Legg til variant</Heading>
      </Dialog.Block>
      <Dialog.Block className='create-variant-modal-form'>
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
        {/* TODO: MIM-2980: Fetch frequency from api and update respective components */}
        <Field>
          <Label>Frekvens</Label>
          <Select
            value={values.frequency_code}
            onChange={(e) => setValues((prevValues) => ({ ...prevValues, frequency_code: e.target.value }))}
          >
            {Object.entries(FrequencyNames).map(([code, name]) => (
              <Select.Option key={`frequency-${name}`} value={code}>
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
          <Button variant='primary' onClick={createVariant}>
            Legg til
          </Button>
          <Button variant='tertiary' onClick={handleCloseModal}>
            Avbryt
          </Button>
        </div>
      </Dialog.Block>
    </Dialog>
  )
}
