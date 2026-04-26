import type { Color } from '@digdir/designsystemet-types'
declare global {
  namespace React {
    interface HTMLAttributes {
      'data-color'?: Color | (string & {})
    }
  }
}
