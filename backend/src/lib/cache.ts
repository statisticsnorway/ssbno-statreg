import { NodeCache } from '@cacheable/node-cache'

// This is an example of how we can implement an in-memory cache of an object of any type.
// TODO: MIM-2824 The timeCache example should be removed before production deployment, but can serve as a template i.e. when fetching users from Entra.
const timeCache = new NodeCache({ stdTTL: 600, checkperiod: 60 })

function resetTimeCache(): Date {
  const currentTime = new Date()

  timeCache.set('time', currentTime)

  return currentTime
}

export function getTimeCache(): Date {
  const cachedTime: Date | undefined = timeCache.get('time') as Date | undefined
  return cachedTime ?? resetTimeCache()
}
