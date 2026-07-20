import { useMemo } from 'react'
import './ContactSelection.css'
import { EXPERIMENTAL_Suggestion as Suggestion, type SuggestionItem, Field } from '@digdir/designsystemet-react'
import type { Contact } from '@ssbno-statreg/shared'
import { formatContact } from '../lib/utils'

export type ContactSelectionProps = {
  contacts: Contact[]
  selected: string[]
  setSelected: (selected: string[]) => void
}

export function ContactSelection({ contacts, selected, setSelected }: ContactSelectionProps) {
  const contactMap = useMemo(
    () =>
      contacts.reduce<Record<string, Contact>>((record, contact) => {
        record[contact.principalName] = contact
        return record
      }, {}),
    [contacts]
  )

  const selectedItems: SuggestionItem[] = selected.map((principalName) => ({
    label: formatContact(contactMap[principalName]),
    value: principalName,
  }))

  const options = useMemo(
    () =>
      contacts.map((contact) => (
        <Suggestion.Option
          className='contact-selection-item'
          key={contact.principalName}
          label={formatContact(contact)}
          value={contact.principalName}
        >
          {formatContact(contact)}
        </Suggestion.Option>
      )),
    [contacts]
  )

  return (
    <Field>
      <Suggestion
        className='contact-selection'
        multiple
        onSelectedChange={(items) => setSelected(items.map((item) => item.value))}
        selected={selectedItems}
      >
        <Suggestion.Input />
        <Suggestion.Clear aria-label='Tøm valgte kontakter' />
        <Suggestion.List className='contact-selection-list'>
          <Suggestion.Empty>Ingen treff</Suggestion.Empty>
          {options}
        </Suggestion.List>
      </Suggestion>
    </Field>
  )
}
