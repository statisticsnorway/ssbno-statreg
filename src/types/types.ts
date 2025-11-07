// ========================
// Root schema types for statreg_data
// ========================

// --- STATISTIKK ---
export interface Statistikk {
  id: number;
  version?: number;
  kortnavn_id?: number;
  dir_flyt?: string | null;
  triggerord?: string | null;
  prioritet?: number | null;
  desk_flyt?: string | null;
  sprak?: string | null;
  triggerord_en?: string | null;
  eierseksjon_id?: number | null;
  forstegangspublisering?: Date | null;
  arsrapportering?: number | null;
  status?: string | null;
  gamle_emnekoder?: string | null;
  relasjon_id?: number | null;
  statistikknavn?: string | null;
  last_updated?: Date | null;
  intern_kommentar?: string | null;
  statistikknavn_en?: string | null;
  date_created?: Date | null;
}

// --- VARIANT ---
export interface Variant {
  id: number;
  version?: number;
  statistikk_id: number;              // FK → STATISTIKK.id
  frekvens_id?: number | null;        // FK → FREKVENS.id
  regionalt_niva_id?: number | null;  // FK → REGIONALT_NIVA.id
  revisjon?: string | null;
  tittel?: string | null;
  navn?: string | null;
  status?: string | null;
  date_created?: Date | null;
  last_updated?: Date | null;
}

// --- PUBLISERING ---
export interface Publisering {
  id: number;
  version?: number;
  variant_id: number;                 // FK → VARIANT.id
  publiseringstidspunkt?: Date | null;
  publiseringstype?: string | null;
  tittel?: string | null;
  status?: string | null;
  url?: string | null;
  kommentar?: string | null;
  date_created?: Date | null;
  last_updated?: Date | null;
}

// --- KORTNAVN ---
export interface Kortnavn {
  id: number;
  navn: string;
  navn_en?: string | null;
  beskrivelse?: string | null;
  beskrivelse_en?: string | null;
  date_created?: Date | null;
  last_updated?: Date | null;
}

// --- SEKSJON ---
export interface Seksjon {
  id: number;
  kode: string;
  navn: string;
  ansvarlig_avdeling?: string | null;
  date_created?: Date | null;
  last_updated?: Date | null;
}

// --- REGIONALT_NIVA ---
export interface RegionaltNiva {
  id: number;
  kode: string;
  navn: string;
}

// --- FREKVENS ---
export interface Frekvens {
  id: number;
  kode: string;
  navn: string;
}

// --- STATISTIKK_KONTAKTER ---
export interface StatistikkKontakter {
  id: number;
  statistikk_id: number;  // FK → STATISTIKK.id
  kontakt_id: number;     // FK → KONTAKT.id
}

// --- STATISTIKK_REGIONALE_NIVAER ---
export interface StatistikkRegionaleNivaer {
  id: number;
  statistikk_id: number;       // FK → STATISTIKK.id
  regionalt_niva_id: number;   // FK → REGIONALT_NIVA.id
}

// --- KONTAKT ---
export interface Kontakt {
  id: number;
  fornavn: string;
  etternavn: string;
  epost?: string | null;
  telefon?: string | null;
  stilling?: string | null;
  date_created?: Date | null;
  last_updated?: Date | null;
}

// --- AUDIT_LOG ---
export interface AuditLog {
  id: number;
  handling: string;
  bruker?: string | null;
  tidspunkt: Date;
  tabell?: string | null;
  rad_id?: number | null;
}
