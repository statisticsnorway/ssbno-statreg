import promBundle from 'express-prom-bundle'

export const promBundleMetrics = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: {
    deployment: 'ssbno-statreg-api',
    namespace: 'ssbno',
    team: 'ssbno',
  },
  promClient: {
    collectDefaultMetrics: {},
  },
})
