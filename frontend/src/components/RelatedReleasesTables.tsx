import './RelatedReleasesTables.css'

import { Tabs } from '@digdir/designsystemet-react'
import { CalendarIcon } from '@navikt/aksel-icons'

import { formatDate } from '../lib/utils'
import { DayStatusTag } from './DayStatus'

type RelatedReleasesTablesProps = {
  shortname: string
  date: string
  dateReleasesTable: React.ReactNode
  variantReleasesTable: React.ReactNode
}

export function RelatedReleasesTables({
  shortname,
  date,
  dateReleasesTable,
  variantReleasesTable,
}: RelatedReleasesTablesProps) {
  return (
    <Tabs defaultValue='selected-publish-date' className='related-releases-tables-tab'>
      <Tabs.List>
        <Tabs.Tab value='selected-publish-date'>
          <CalendarIcon />
          Publiseringer på valgt dato
        </Tabs.Tab>
        <Tabs.Tab value='variant-releases'>Alle publiseringer på {shortname}</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel className='p-0' value='selected-publish-date'>
        <div className='description-wrapper'>
          <span>Innmeldte datoer den {formatDate(date)}</span>
          <DayStatusTag status={'MANY'} />
        </div>
        {dateReleasesTable}
      </Tabs.Panel>
      <Tabs.Panel className='p-0' value='variant-releases'>
        {variantReleasesTable}
      </Tabs.Panel>
    </Tabs>
  )
}
