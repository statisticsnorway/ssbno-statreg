import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
import {
  Button,
  Heading,
  Dialog,
  Field,
  Label,
  Input,
  Select,
  Paragraph,
  Popover,
} from '@statisticsnorway/design-react'
import { TrashIcon } from '@navikt/aksel-icons'

import './VariantModal.css'
import client from '../api'
import { RevisionNames, type Frequency, type Variant } from '@ssbno-statreg/shared'
import { ErrorAlert } from './ErrorAlert'

export function useVariantModal() {
  const [editVariantIndex, setEditVariantIndex] = useState<number | null>(null)
  const addVariantButtonRef = useRef<HTMLButtonElement>(null)
  const returnFocusToAddVariantButtonRef = useRef(false)
  const [variantModalCloseCount, setVariantModalCloseCount] = useState(0)

  useEffect(() => {
    if (!returnFocusToAddVariantButtonRef.current) return

    returnFocusToAddVariantButtonRef.current = false
    addVariantButtonRef.current?.focus()
  }, [variantModalCloseCount])

  function handleOpenCreateVariantModal() {
    setEditVariantIndex(null)
  }

  function handleOpenEditVariantModal(index: number) {
    setEditVariantIndex(index)
  }

  function handleVariantModalActionClose() {
    returnFocusToAddVariantButtonRef.current = true
  }

  function handleVariantModalClose() {
    setEditVariantIndex(null)
    setVariantModalCloseCount((count) => count + 1)
  }

  return {
    editVariantIndex,
    addVariantButtonRef,
    variantModalCloseCount,
    handleOpenCreateVariantModal,
    handleOpenEditVariantModal,
    handleVariantModalActionClose,
    handleVariantModalClose,
  }
}

type VariantModalProps = {
  dialogId: string
  setCreatedVariants: Dispatch<SetStateAction<Variant[]>>
  editVariantValues?: Variant
  editVariantIndex?: number | null
  onActionClose?: () => void
  onAfterClose?: () => void
}

type CreateVariantFormValues = {
  revision_code: string
  frequency_code: string
  level_of_detail_name: string
  level_of_detail_name_en: string
}

export function VariantModal({
  dialogId,
  setCreatedVariants,
  editVariantValues,
  editVariantIndex,
  onActionClose,
  onAfterClose,
}: Readonly<VariantModalProps>) {
  const [frequencies, setFrequencies] = useState<Frequency[]>([])
  const [apiError, setApiError] = useState<string[]>([])
  const [isDeletePopoverOpen, setIsDeletePopoverOpen] = useState(false)
  const [values, setValues] = useState<CreateVariantFormValues>({
    revision_code: editVariantValues?.revision?.code ?? 'I',
    frequency_code: editVariantValues?.frequency?.code ?? 'U',
    level_of_detail_name: editVariantValues?.level_of_detail?.name ?? '',
    level_of_detail_name_en: editVariantValues?.level_of_detail?.name_en ?? '',
  })
  const deleteTriggerRef = useRef<HTMLButtonElement>(null)
  const returnFocusToDeleteTriggerRef = useRef(false)

  const isEditMode = typeof editVariantIndex === 'number'

  useEffect(() => {
    if (!isDeletePopoverOpen && returnFocusToDeleteTriggerRef.current) {
      returnFocusToDeleteTriggerRef.current = false
      deleteTriggerRef.current?.focus()
    }
  }, [isDeletePopoverOpen])

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
        ...(isEditMode && editVariantValues?.id ? { id: editVariantValues.id } : {}),
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
  }

  function deleteVariant() {
    if (!isEditMode) return

    setCreatedVariants((prevVariants: Variant[]) => prevVariants.filter((_, index) => index !== editVariantIndex))
  }

  function handleDialogClose() {
    setApiError([])
    setIsDeletePopoverOpen(false)
    onAfterClose?.()
  }

  function closeDeletePopoverAndReturnFocus() {
    returnFocusToDeleteTriggerRef.current = true
    setIsDeletePopoverOpen(false)
  }

  const canDeleteVariant = isEditMode && !editVariantValues?.id

  return (
    <Dialog id={dialogId} aria-labelledby='variant-modal-heading' onClose={handleDialogClose} closedby='any'>
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
            // @ts-expect-error native "autofocus" is not part of the React types
            autofocus='true'
            aria-describedby='variant-modal-description'
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
            <Button variant='primary' command='close' commandfor={dialogId} onClick={createVariant}>
              {isEditMode ? 'Lagre' : 'Legg til'}
            </Button>
            <Button variant='tertiary' command='close' commandfor={dialogId}>
              Avbryt
            </Button>
          </div>
          {canDeleteVariant && (
            <Popover.TriggerContext>
              <Popover.Trigger
                ref={deleteTriggerRef}
                variant='tertiary'
                data-color='danger'
                onClick={() => setIsDeletePopoverOpen(!isDeletePopoverOpen)}
              >
                <TrashIcon aria-hidden /> Slett
              </Popover.Trigger>
              <Popover
                placement='top-start'
                autoPlacement={false}
                open={isDeletePopoverOpen}
                onClose={closeDeletePopoverAndReturnFocus}
                data-color='danger'
              >
                <Paragraph>
                  Denne varianten har ikke publiseringer, og kan slettes. Vil du fortsatt slette varianten?
                </Paragraph>
                <div className='variant-modal-delete-popover-buttons'>
                  <Button
                    command='close'
                    commandfor={dialogId}
                    data-color='danger'
                    onClick={() => {
                      onActionClose?.()
                      setIsDeletePopoverOpen(false)
                      deleteVariant()
                    }}
                  >
                    Ja, slett
                  </Button>
                  <Button variant='tertiary' onClick={closeDeletePopoverAndReturnFocus}>
                    Avbryt
                  </Button>
                </div>
              </Popover>
            </Popover.TriggerContext>
          )}
        </div>
      </Dialog.Block>
    </Dialog>
  )
}
