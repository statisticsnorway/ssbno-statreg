
export interface AuditLog {
  id: bigint
  property_name?: string
  last_updated?: Date
  old_value?: string
  actor?: string
  uri?: string
  new_value?: string
  persisted_object_version?: number
  date_created?: Date
  class_name?: string
  event_name?: string
  persisted_object_id?: number
}

export interface Frekvens {
  id: bigint
  version?: number
  navn?: string
  kode?: string
}

export interface KalenderDato {
  id: bigint
  version?: number
  kommentar?: string
  dag?: Date
}

export interface Kontakt {
  id: bigint
  version?: number
  initialer?: string
  mobil?: string
  navn?: string
  last_updated?: Date
  telefon?: string
  epost?: string
  date_created?: Date
  inaktiv?: number
  navn_en?: string
}

export interface Kortnavn {
  id: bigint
  version?: number
  navn?: string
  last_updated?: Date
  date_created?: Date
}

export interface Publisering {
  id: bigint
  version?: number
  tidspunkt?: Date
  er_endret?: number
  last_updated?: Date
  intern_kommentar?: string
  periode_til?: Date
  desk_flyt?: string
  variant_id?: bigint
  periode_fra?: Date
  er_avlyst?: number
  date_created?: Date
  datotype?: string
  import_flag?: number
}

export interface RegionaltNiva {
  id: bigint
  version?: number
  navn?: string
  kode?: string
}

export interface Seksjon {
  id: bigint
  version?: number
  navn?: string
  kode?: string
  navn_en?: string
}

export interface Statistikk {
  id: bigint
  version?: number
  kortnavn_id?: bigint
  dir_flyt?: string
  triggerord?: string
  prioritet?: number
  desk_flyt?: string
  sprak?: string
  triggerord_en?: string
  eierseksjon_id?: bigint
  forstegangspublisering?: Date
  arsrapportering?: number
  status?: string
  gamle_emnekoder?: string
  relasjon_id?: bigint
  statistikknavn?: string
  last_updated?: Date
  intern_kommentar?: string
  statistikknavn_en?: string
  date_created?: Date
}

export interface StatistikkKontakter {
  statistikk_id: bigint
  kontakt_id: bigint
  kontakter_idx?: number
}

export interface StatistikkRegionaleNivaer {
  regionalt_niva_id: bigint
  statistikk_id: bigint
}

export interface Variant {
  id: bigint
  version?: number
  frekvens_id?: bigint
  last_updated?: Date
  revisjon?: string
  statistikk_id?: bigint
  detaljniva_en?: string
  detaljniva?: string
  er_opphort?: number
  date_created?: Date
}
