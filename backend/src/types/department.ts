export interface Division {
  code: number
  name: string
  notes?: string
}

export interface Department {
  code: string
  divisions: Division[]
  name: string
  notes?: string
}
