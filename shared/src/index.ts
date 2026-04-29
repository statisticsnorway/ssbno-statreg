export * from './enums.js'
import type { components, paths } from './api-types'

export type BlockedReleaseDate = components['schemas']['Blocked_release_date']
export type CalenderDate = components['schemas']['Calender_date']
export type Contact = components['schemas']['Contact']
export type Frequency = components['schemas']['Frequency']
export type LevelOfDetail = components['schemas']['Level_of_detail']
export type RegionLevel = components['schemas']['Region_level']
export type ReleaseDetails = components['schemas']['Release_details']
export type ReleaseCreate = components['schemas']['Release_create']
export type ReleaseUpdate = components['schemas']['Release_update']
export type ReleaseListing = components['schemas']['Release_listing']
export type Revision = components['schemas']['Revision']
export type StatisticDetails = components['schemas']['Statistic_details']
export type StatisticCreate = components['schemas']['Statistic_create']
export type StatisticUpdate = components['schemas']['Statistic_update']
export type StatisticListing = components['schemas']['Statistic_listing']
export type Variant = components['schemas']['Variant']

// TODO: Remove workaround for CalendarDateStatus and CalendarDates after MIM-2661 has been merged
export type CalendarDateStatus = 'blocked' | 'free' | 'few' | 'more' | 'full'

export type CalendarDates = {
  [key: string]: {
    status: CalendarDateStatus
  }
}

export type ReleaseListingResponse = paths['/releases']['get']['responses']['200']['content']['application/json']
