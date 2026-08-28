import type { ReactNode, RefObject } from 'react'
import { Button, Card, Heading, Label, Paragraph, ValidationMessage } from '@statisticsnorway/design-react'
import { PlusCircleIcon, PencilWritingIcon } from '@navikt/aksel-icons'
import { RevisionNames, type Variant } from '@ssbno-statreg/shared'

type VariantEditorSectionProps = {
  createdVariants: Variant[]
  variantDialogId: string
  addVariantButtonRef: RefObject<HTMLButtonElement | null>
  variantsError?: string
  variantLabel: ReactNode
  onOpenCreateVariantModal: () => void
  onOpenEditVariantModal: (index: number) => void
}

export function VariantEditorSection({
  createdVariants,
  variantDialogId,
  addVariantButtonRef,
  variantsError,
  variantLabel,
  onOpenCreateVariantModal,
  onOpenEditVariantModal,
}: Readonly<VariantEditorSectionProps>) {
  const cancelledVariants = createdVariants.some((variant) => !variant.cancelled)

  return (
    <>
      <div className='created-variants-title-container'>
        <Label>{variantLabel}</Label>
        <Paragraph>Legg til variant for å kunne melde publiseringsdato på statistikken</Paragraph>
      </div>
      {cancelledVariants && (
        <div className='created-variants-container'>
          {createdVariants.map((variant, index) => {
            if (variant.cancelled) return null

            return (
              <Card
                key={['created-variant', variant.frequency?.code ?? index, variant.revision?.code ?? index].join('-')}
                variant='tinted'
              >
                <Card.Block>
                  <div className='created-variant-heading-container'>
                    <Heading>
                      {[
                        variant.frequency!.name,
                        RevisionNames[variant.revision!.code as keyof typeof RevisionNames].toLocaleLowerCase(),
                      ].join(', ')}
                    </Heading>
                    <Button
                      variant='tertiary'
                      data-color='danger'
                      command='show-modal'
                      commandfor={variantDialogId}
                      onClick={() => onOpenEditVariantModal(index)}
                    >
                      <PencilWritingIcon /> Rediger
                    </Button>
                  </div>
                  <Paragraph>
                    Detaljnivå: {variant.level_of_detail?.name} <br />
                    Engelsk detaljnivå: {variant.level_of_detail?.name_en}
                  </Paragraph>
                </Card.Block>
              </Card>
            )
          })}
        </div>
      )}
      <div className='create-variant-button-container'>
        <Button
          id='variants'
          ref={addVariantButtonRef}
          variant='secondary'
          aria-invalid={!!variantsError}
          command='show-modal'
          commandfor={variantDialogId}
          onClick={onOpenCreateVariantModal}
        >
          <PlusCircleIcon /> Legg til variant
        </Button>
        {variantsError && <ValidationMessage>{variantsError}</ValidationMessage>}
      </div>
    </>
  )
}
