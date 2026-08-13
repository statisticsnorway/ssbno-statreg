/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { getVersions } from '@/services/versionService'

let prismaMock: any

describe('versionService ', () => {
  beforeEach(() => {
    prismaMock = {
      auditLog: {
        findMany: vi.fn(() => Promise.resolve([])),
      },
      statistic: {
        findFirst: vi.fn(),
      },
      release: {
        findFirst: vi.fn(),
      },
    }
  })

  describe('getVersions ', () => {
    test('handles mix of new and old statreg entries', async () => {
      const dateCreated = new Date(2016, 0, 1)
      const update1 = new Date(2026, 2, 1)
      const update2 = new Date(2026, 8, 1)

      prismaMock.auditLog.findMany.mockResolvedValue([
        // new statreg entry
        {
          id: 5,
          last_updated: update2,
          property_name: null,
          old_value: JSON.stringify({
            status: 'K',
            dir_approval_status: 'GODKJENT',
            comment: '',
          }),
          new_value: JSON.stringify({
            status: 'A',
            dir_approval_status: 'FORSLAG',
            comment: 'Oppdaterte status fra kommende til aktiv.',
          }),
          actor: 'user1',
          uri: null,
          persisted_object_version: 3,
          date_created: dateCreated,
          class_name: 'Statistic',
          event_name: 'update',
          persisted_object_id: 1,
        },
        // old statreg entries
        {
          id: 4,
          last_updated: update1,
          property_name: 'deskFlyt',
          old_value: 'GODKJENT',
          new_value: 'FORSLAG',
          actor: 'user2',
          uri: null,
          persisted_object_version: 1,
          date_created: dateCreated,
          class_name: 'Statistic',
          event_name: 'update',
          persisted_object_id: 1,
        },
        {
          id: 3,
          last_updated: update1,
          property_name: 'kontakter',
          old_value: '[A, B, C]',
          new_value: '[A, B]',
          actor: 'user2',
          uri: null,
          persisted_object_version: 1,
          date_created: dateCreated,
          class_name: 'Statistic',
          event_name: 'update',
          persisted_object_id: 1,
        },
        {
          id: 2,
          last_updated: update1,
          property_name: 'internKommentar',
          old_value: '',
          new_value: 'Fjernet C fra kontaktpersoner.',
          actor: 'user2',
          uri: null,
          persisted_object_version: 1,
          date_created: dateCreated,
          class_name: 'Statistic',
          event_name: 'update',
          persisted_object_id: 1,
        },
        {
          id: 1,
          last_updated: dateCreated,
          property_name: null,
          old_value: null,
          new_value: null,
          actor: 'system',
          uri: null,
          persisted_object_version: null,
          date_created: dateCreated,
          class_name: 'Statistic',
          event_name: 'create',
          persisted_object_id: 1,
        },
      ])

      const result = await getVersions('Statistic', 1, prismaMock)

      expect(result).toStrictEqual([
        {
          change_type: 'update',
          changed_at: '2026-09-01T00:00:00.000Z',
          changed_by: 'user1',
          changed_values: [
            { field_name: 'status', old_value: 'K', new_value: 'A' },
            { field_name: 'dir_approval_status', old_value: 'GODKJENT', new_value: 'FORSLAG' },
          ],
          comment: 'Oppdaterte status fra kommende til aktiv.',
        },
        {
          change_type: 'update',
          changed_at: '2026-03-01T00:00:00.000Z',
          changed_by: 'user2',
          changed_values: [{ field_name: 'deskFlyt', old_value: 'GODKJENT', new_value: 'FORSLAG' }],
          comment: 'Fjernet C fra kontaktpersoner.',
        },
        {
          change_type: 'update',
          changed_at: '2026-03-01T00:00:00.000Z',
          changed_by: 'user2',
          changed_values: [{ field_name: 'kontakter', old_value: '[A, B, C]', new_value: '[A, B]' }],
          comment: 'Fjernet C fra kontaktpersoner.',
        },
        {
          change_type: 'create',
          changed_at: '2016-01-01T00:00:00.000Z',
          changed_by: 'system',
          changed_values: undefined,
          comment: '',
        },
      ])
    })
  })
})
