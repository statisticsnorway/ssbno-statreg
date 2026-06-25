// users-cache.test.ts
import { beforeEach, describe, expect, test } from 'vitest'

import { setUsersCache, getUsersCache, clearUsersCache } from './cache'

describe('Users cache', () => {
  const mockUsers = [
    {
      displayName: 'Ola Nordmann',
      email: 'ola.nordmann@ssb.no',
      businessPhone: null,
    },
    {
      displayName: 'Infotjenesten',
      email: 'infotjenesten@ssb.no',
      businessPhone: '11223344',
    },
  ]

  beforeEach(() => {
    clearUsersCache()
  })

  test('return undefined when cache is empty', () => {
    expect(getUsersCache()).toBeUndefined()
  })

  test('store and return users', () => {
    const result = setUsersCache(mockUsers)

    expect(result).toBe(mockUsers)
    expect(getUsersCache()).toEqual(mockUsers)
  })

  test('clear cached users', () => {
    setUsersCache(mockUsers)

    expect(getUsersCache()).toEqual(mockUsers)

    clearUsersCache()

    expect(getUsersCache()).toBeUndefined()
  })

  test('overwrite previously cached users', () => {
    const users1 = [
      {
        displayName: 'Ola Nordmann',
        email: 'ola.nordmann@ssb.no',
        businessPhone: null,
      },
    ]
    const users2 = [
      {
        displayName: 'Infotjenesten',
        email: 'infotjenesten@ssb.no',
        businessPhone: '11223344',
      },
    ]

    setUsersCache(users1)
    setUsersCache(users2)

    expect(getUsersCache()).toEqual(users2)
  })
})
