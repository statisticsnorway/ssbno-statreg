import './ContactSelection.css'
import { EXPERIMENTAL_Suggestion as Suggestion, type SuggestionItem, Field } from '@digdir/designsystemet-react'
import type { Contact } from '@ssbno-statreg/shared'

export type ContactSelectionProps = {
  contacts: Contact[]
  selected: Contact[]
  onChange: (selected: Contact[]) => void
}

export function ContactSelection({ contacts, selected, onChange }: ContactSelectionProps) {
  const selectedItems: SuggestionItem[] = selected.map((contact) => ({
    label: contact.name || contact.principalName || '',
    value: contact.principalName || '',
  }))

  function handleChange(items: SuggestionItem[]) {
    const selectedContacts = items
      .map((item) => contacts.find((contact) => contact.principalName === item.value))
      .filter((contact): contact is Contact => contact !== undefined)

    onChange(selectedContacts)
  }

  return (
    <Field>
      <Suggestion
        className='contact-selection'
        multiple
        onSelectedChange={handleChange}
        selected={selectedItems}
      >
        <Suggestion.Input />
        <Suggestion.Clear aria-label='Tøm valgte kontakter' />
        <Suggestion.List className='contact-selection-list'>
          <Suggestion.Empty>Ingen treff</Suggestion.Empty>
          {contacts.map((contact) => {
            const value = contact.principalName || ''
            const contactLabel = contact.name || value

            return (
              <Suggestion.Option className='contact-selection-item' key={value} label={contactLabel} value={value}>
                {contact.name} ({contact.principalName})
              </Suggestion.Option>
            )
          })}
        </Suggestion.List>
      </Suggestion>
    </Field>
  )
}
