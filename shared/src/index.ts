export * from './enums.js'
export * from './create-statistics.js'
import type { components, paths } from './api-types'

export type BlockedReleaseDate = components['schemas']['Blocked_release_date']
export type CalenderDate = components['schemas']['Calender_date']
export type Contact = components['schemas']['Contact']
export type Division = components['schemas']['Division']
export type Frequency = components['schemas']['Frequency']
export type LevelOfDetail = components['schemas']['Level_of_detail']
export type RegionLevel = components['schemas']['Region_level']
export type ReleaseDetails = components['schemas']['Release_details']
export type ReleaseCreate = components['schemas']['Release_create']
export type ReleaseUpdate = components['schemas']['Release_update']
export type ReleaseListing = components['schemas']['Release_listing']
export type Revision = components['schemas']['Revision']
export type Shortname = components['schemas']['Shortname']
export type ShortnameListing = components['schemas']['Shortname_listing']
export type StatisticDetails = components['schemas']['Statistic_details']
export type StatisticCreate = components['schemas']['Statistic_create']
export type StatisticUpdate = components['schemas']['Statistic_update']
export type StatisticListing = components['schemas']['Statistic_listing']
export type Variant = components['schemas']['Variant']

//Request bodies
export type StatisticRequest = paths['/statistics/{shortname}']['post']['requestBody']['content']['application/json']

//Response bodies
export type StatisticListingResponse = paths['/statistics']['get']['responses']['200']['content']['application/json']
export type ReleaseListingResponse = paths['/releases']['get']['responses']['200']['content']['application/json']
export type ReleaseByIdResponse = paths['/releases/{id}']['get']['responses']['200']['content']['application/json']
export type ReleasesBulkApproveResponse =
  paths['/releases/bulk-approve']['post']['responses']['207']['content']['application/json']
export type AuthResponse = paths['/auth/authenticate']['get']['responses']['200']['content']['application/json']
