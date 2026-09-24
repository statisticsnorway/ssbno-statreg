import { useState, useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from 'react'
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
import { TrashIcon, ArchiveIcon } from '@navikt/aksel-icons'

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
  shortname?: string
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
  cancelled: boolean
}

type DeleteVariantPopoverProps = {
  deleteTriggerRef: RefObject<HTMLButtonElement | null>
  isDeletePopoverOpen: boolean
  setIsDeletePopoverOpen: Dispatch<SetStateAction<boolean>>
  dialogId: string
  onActionClose?: () => void
  deleteVariant: () => void
  closeDeletePopoverAndReturnFocus: () => void
}

type SetVariantCancelledPopoverProps = {
  variantCancelledTriggerRef: RefObject<HTMLButtonElement | null>
  isSetVariantCancelledPopoverOpen: boolean
  setIsSetVariantCancelledPopoverOpen: Dispatch<SetStateAction<boolean>>
  dialogId: string
  onActionClose?: () => void
  setVariantCancelled: () => void
  closeVariantCancelledAndReturnFocus: () => void
  shortname?: string
  variantId?: number
  onError: (message: string) => void
}

async function variantHasUpcomingRelease(shortname?: string, variantId?: number): Promise<boolean> {
  if (!shortname || !variantId) return false

  const { data, error } = await client.GET('/statistics/{shortname}/variants/{id}/releases', {
    params: { path: { shortname, id: variantId }, query: { count: 1, sort: '-publish_time' } },
  })

  if (error) throw new Error(error.message)

  const publishTime = data.releases?.[0]?.publish_time
  return !!publishTime && new Date(publishTime) > new Date()
}

function DeleteVariantPopover({
  deleteTriggerRef,
  isDeletePopoverOpen,
  setIsDeletePopoverOpen,
  dialogId,
  onActionClose,
  deleteVariant,
  closeDeletePopoverAndReturnFocus,
}: Readonly<DeleteVariantPopoverProps>) {
  return (
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
        <Paragraph>Denne varianten har ikke publiseringer, og kan slettes. Vil du fortsatt slette varianten?</Paragraph>
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
  )
}

function SetVariantCancelledPopover({
  variantCancelledTriggerRef,
  isSetVariantCancelledPopoverOpen,
  setIsSetVariantCancelledPopoverOpen,
  dialogId,
  onActionClose,
  setVariantCancelled,
  closeVariantCancelledAndReturnFocus,
  shortname,
  variantId,
  onError,
}: Readonly<SetVariantCancelledPopoverProps>) {
  const [hasUpcomingPublications, setHasUpcomingPublications] = useState(false)

  async function handleClick() {
    if (isSetVariantCancelledPopoverOpen) {
      closeVariantCancelledAndReturnFocus()
      return
    }

    try {
      setHasUpcomingPublications(await variantHasUpcomingRelease(shortname, variantId))
      setIsSetVariantCancelledPopoverOpen(true)
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Kunne ikke sjekke kommende publiseringer')
    }
  }

  return (
    <Popover.TriggerContext>
      <Popover.Trigger
        ref={variantCancelledTriggerRef}
        variant='tertiary'
        data-color='danger'
        onClick={() => void handleClick()}
      >
        <ArchiveIcon aria-hidden /> Sett som opphørt
      </Popover.Trigger>
      <Popover
        placement={hasUpcomingPublications ? 'right' : 'top-start'}
        autoPlacement={false}
        open={isSetVariantCancelledPopoverOpen}
        onClose={closeVariantCancelledAndReturnFocus}
        {...(hasUpcomingPublications ? {} : { 'data-color': 'danger' })}
      >
        {hasUpcomingPublications ? (
          <>
            <Paragraph>
              Varianten har tilknyttede kommende publiseringer og kan derfor ikke settes til opphørt. Fjern de kommende
              publiseringene før du kan sette varianten til opphørt.
            </Paragraph>
            <div className='variant-modal-delete-popover-buttons'>
              <Button onClick={closeVariantCancelledAndReturnFocus}>OK</Button>
            </div>
          </>
        ) : (
          <>
            <Paragraph>
              Varianten har tilknyttede publiseringer, og kan ikke slettes. Vil du sette den som opphørt i stedet?
            </Paragraph>
            <div className='variant-modal-delete-popover-buttons'>
              <Button
                command='close'
                commandfor={dialogId}
                data-color='danger'
                onClick={() => {
                  onActionClose?.()
                  setIsSetVariantCancelledPopoverOpen(false)
                  setVariantCancelled()
                }}
              >
                Ja, sett som opphørt
              </Button>
              <Button variant='tertiary' onClick={closeVariantCancelledAndReturnFocus}>
                Avbryt
              </Button>
            </div>
          </>
        )}
      </Popover>
    </Popover.TriggerContext>
  )
}

export function VariantModal({
  dialogId,
  shortname,
  setCreatedVariants,
  editVariantValues,
  editVariantIndex,
  onActionClose,
  onAfterClose,
}: Readonly<VariantModalProps>) {
  const [frequencies, setFrequencies] = useState<Frequency[]>([])
  const [apiError, setApiError] = useState<string[]>([])
  const [values, setValues] = useState<CreateVariantFormValues>({
    revision_code: editVariantValues?.revision?.code ?? 'I',
    frequency_code: editVariantValues?.frequency?.code ?? 'U',
    level_of_detail_name: editVariantValues?.level_of_detail?.name ?? '',
    level_of_detail_name_en: editVariantValues?.level_of_detail?.name_en ?? '',
    cancelled: editVariantValues?.cancelled ?? false,
  })

  const [isDeletePopoverOpen, setIsDeletePopoverOpen] = useState(false)
  const [isSetVariantCancelledPopoverOpen, setIsSetVariantCancelledPopoverOpen] = useState(false)

  const deleteTriggerRef = useRef<HTMLButtonElement>(null)
  const returnFocusToDeleteTriggerRef = useRef(false)

  const variantCancelledTriggerRef = useRef<HTMLButtonElement>(null)
  const returnFocusToVariantCancelledTriggerRef = useRef(false)

  const isExistingVariant = typeof editVariantIndex === 'number'

  useEffect(() => {
    if (!isDeletePopoverOpen && returnFocusToDeleteTriggerRef.current) {
      returnFocusToDeleteTriggerRef.current = false
      deleteTriggerRef.current?.focus()
    }
  }, [isDeletePopoverOpen])

  useEffect(() => {
    if (!isSetVariantCancelledPopoverOpen && returnFocusToVariantCancelledTriggerRef.current) {
      returnFocusToVariantCancelledTriggerRef.current = false
      variantCancelledTriggerRef.current?.focus()
    }
  }, [isSetVariantCancelledPopoverOpen])

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
        ...(isExistingVariant && editVariantValues?.id ? { id: editVariantValues.id } : {}),
        revision: {
          code: values.revision_code,
        },
        frequency: selectedFrequency,
        level_of_detail: {
          name: values.level_of_detail_name,
          name_en: values.level_of_detail_name_en,
        },
        cancelled: values.cancelled,
      }

      if (!isExistingVariant) {
        return [...prevVariants, nextVariant]
      }

      return prevVariants.map((variant, index) => (index === editVariantIndex ? nextVariant : variant))
    })
  }

  function deleteVariant() {
    if (!isExistingVariant) return

    setCreatedVariants((prevVariants: Variant[]) => prevVariants.filter((_, index) => index !== editVariantIndex))
  }

  function handleDialogClose() {
    setApiError([])
    setIsDeletePopoverOpen(false)
    setIsSetVariantCancelledPopoverOpen(false)
    onAfterClose?.()
  }

  function closeDeletePopoverAndReturnFocus() {
    returnFocusToDeleteTriggerRef.current = true
    setIsDeletePopoverOpen(false)
  }

  function closeVariantCancelledAndReturnFocus() {
    returnFocusToVariantCancelledTriggerRef.current = true
    setIsSetVariantCancelledPopoverOpen(false)
  }

  function setVariantCancelled() {
    if (!isExistingVariant) return

    setValues((prevValues) => ({ ...prevValues, cancelled: true }))
    setCreatedVariants((prevVariants: Variant[]) =>
      prevVariants.map((variant, index) => (index === editVariantIndex ? { ...variant, cancelled: true } : variant))
    )
  }

  const isNewVariant = isExistingVariant && !editVariantValues?.id

  return (
    <Dialog id={dialogId} aria-labelledby='variant-modal-heading' onClose={handleDialogClose} closedby='any'>
      <Dialog.Block>
        <Heading id='variant-modal-heading' data-size='xs'>
          {isExistingVariant ? 'Rediger variant' : 'Legg til variant'}
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
              {isExistingVariant ? 'Lagre' : 'Legg til'}
            </Button>
            <Button variant='tertiary' command='close' commandfor={dialogId}>
              Avbryt
            </Button>
          </div>
          {isNewVariant ? (
            <DeleteVariantPopover
              deleteTriggerRef={deleteTriggerRef}
              isDeletePopoverOpen={isDeletePopoverOpen}
              setIsDeletePopoverOpen={setIsDeletePopoverOpen}
              dialogId={dialogId}
              onActionClose={onActionClose}
              deleteVariant={deleteVariant}
              closeDeletePopoverAndReturnFocus={closeDeletePopoverAndReturnFocus}
            />
          ) : (
            isExistingVariant && (
              <SetVariantCancelledPopover
                variantCancelledTriggerRef={variantCancelledTriggerRef}
                isSetVariantCancelledPopoverOpen={isSetVariantCancelledPopoverOpen}
                setIsSetVariantCancelledPopoverOpen={setIsSetVariantCancelledPopoverOpen}
                dialogId={dialogId}
                onActionClose={onActionClose}
                setVariantCancelled={setVariantCancelled}
                closeVariantCancelledAndReturnFocus={closeVariantCancelledAndReturnFocus}
                shortname={shortname}
                variantId={editVariantValues?.id}
                onError={(message) => setApiError((prev) => [...prev, message])}
              />
            )
          )}
        </div>
      </Dialog.Block>
    </Dialog>
  )
}
