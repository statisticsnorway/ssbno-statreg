export interface KlassClassification {
  name: string
  id: string
  validFrom: Date
  lastModified: Date
  published: string[]
  introduction: string
  contactPerson: { name: string; email: string; phone: string }
  owningSection: string
  legalBase: string
  publications: string
  derivedFrom: string
  correspondenceTables: []
  classificationVariants: []
  changelogs: []
  levels: { levelNumber: string; levelName: string }[]
  classificationItems: {
    code: string
    parentCode?: string
    level: string
    name: string
    shortName: string
    notes: string
  }[]
  _links: {
    self: { href: string }
  }
}
