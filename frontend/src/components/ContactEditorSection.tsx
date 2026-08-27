import type { ReactNode } from 'react'
import { Field, Label, Paragraph, ValidationMessage } from '@statisticsnorway/design-react'
import type { Contact } from '@ssbno-statreg/shared'
import { ContactSelection } from './ContactSelection'

type ContactEditorSectionProps = {
  contacts: Contact[]
  selectedContacts: string[]
  contactsError?: string
  contactLabel: ReactNode
  onContactsChange: (selectedContacts: string[]) => void
}

export function ContactEditorSection({
  contacts,
  selectedContacts,
  contactsError,
  contactLabel,
  onContactsChange,
}: Readonly<ContactEditorSectionProps>) {
  return (
    <div className='contact-section'>
      <Label>{contactLabel}</Label>
      <Paragraph className='contact-section-description'>
        Søk og legg til kontakt. Navn vises under overskriften 'Kontakt' på statistikksiden på ssb.no
      </Paragraph>
      <Field className='contact-field'>
        <ContactSelection
          id='contacts'
          ariaInvalid={!!contactsError}
          contacts={contacts}
          selected={selectedContacts}
          setSelected={onContactsChange}
        />
        {contactsError && <ValidationMessage>{contactsError}</ValidationMessage>}
      </Field>
    </div>
  )
}
