/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, test, expect, beforeEach } from 'vitest'
import {
  getVersions,
  diffObjects,
  auditlogEntryToVersion,
  getStatisticVersions,
  getReleaseVersions,
} from '@/services/versionService'

let prismaMock: any

const baseAuditlogEntry = {
  id: 1,
  last_updated: new Date(2026, 2, 1),
  property_name: null,
  old_value: null,
  new_value: null,
  actor: 'user',
  uri: null,
  persisted_object_version: 1,
  date_created: new Date(2026, 2, 1),
  class_name: 'Statistic',
  event_name: 'update',
  persisted_object_id: 1,
}

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

  describe('diffObjects', () => {
    test('detects changed fields', () => {
      const oldObject = {
        field_a: 'old',
        field_b: 'old',
      }
      const newObject = {
        field_a: 'new',
        field_b: 'new',
      }

      const result = diffObjects(oldObject, newObject)

      expect(result).toStrictEqual([
        { field_name: 'field_a', old_value: 'old', new_value: 'new' },
        { field_name: 'field_b', old_value: 'old', new_value: 'new' },
      ])
    })

    test('ignores unchanged fields', () => {
      const oldObject = {
        field_a: 'same',
        field_b: 'same',
      }
      const newObject = {
        field_a: 'same',
        field_b: 'same',
      }

      const result = diffObjects(oldObject, newObject)

      expect(result).toStrictEqual([])
    })

    test('ignores comment and last_updated', () => {
      const oldObject = {
        comment: 'Old comment',
        last_updated: '2026-01-01',
      }
      const newObject = {
        comment: 'New comment',
        last_updated: '2026-09-01',
      }

      const result = diffObjects(oldObject, newObject)

      expect(result).toStrictEqual([])
    })
  })

  describe('auditlogEntryToVersion', () => {
    test('handles create event', () => {
      const entry = {
        ...baseAuditlogEntry,
        event_name: 'create',
      }

      const result = auditlogEntryToVersion(entry)

      expect(result).toStrictEqual({
        change_type: 'create',
        changed_at: baseAuditlogEntry.last_updated.toISOString(),
        changed_by: baseAuditlogEntry.actor,
        changed_values: undefined,
        comment: '',
      })
    })

    test('handles old statreg update event', () => {
      const entry = {
        ...baseAuditlogEntry,
        property_name: 'deskFlyt',
        old_value: 'GODKJENT',
        new_value: 'FORSLAG',
        event_name: 'update',
      }

      const result = auditlogEntryToVersion(entry)

      expect(result).toStrictEqual({
        change_type: 'update',
        changed_at: baseAuditlogEntry.last_updated.toISOString(),
        changed_by: baseAuditlogEntry.actor,
        changed_values: [
          {
            field_name: entry.property_name,
            old_value: entry.old_value,
            new_value: entry.new_value,
          },
        ],
        comment: '',
      })
    })

    test('handles new statreg update event', () => {
      const entry = {
        ...baseAuditlogEntry,
        old_value: '{"comment":""}',
        new_value: '{"comment":"Test comment"}',
        event_name: 'update',
      }

      const result = auditlogEntryToVersion(entry)

      expect(result).toMatchObject({
        change_type: 'update',
        changed_at: baseAuditlogEntry.last_updated.toISOString(),
        changed_by: baseAuditlogEntry.actor,
        changed_values: [],
        comment: 'Test comment',
      })
    })

    test('handles new statreg update event with unparseable old_value', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const entry = {
        ...baseAuditlogEntry,
        old_value: 'invalid json {',
        new_value: '{}',
        event_name: 'update',
      }

      const result = auditlogEntryToVersion(entry)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Old or new value of auditlog entry with id ${baseAuditlogEntry.id} could not be parsed`
      )
      expect(result).toMatchObject({
        change_type: 'update',
        changed_at: baseAuditlogEntry.last_updated.toISOString(),
        changed_by: baseAuditlogEntry.actor,
        changed_values: undefined,
        comment: '',
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('getStatisticVersions', () => {
    test('throws 404 when statistic not found', async () => {
      prismaMock.statistic.findFirst.mockResolvedValue(null)

      await expect(getStatisticVersions('nonexistent', prismaMock)).rejects.toThrow(
        expect.objectContaining({ statregError: "Shortname 'nonexistent' not found", status: 404 })
      )
    })

    test('returns versions when statistic found', async () => {
      prismaMock.statistic.findFirst.mockResolvedValue({ id: 1 })

      const result = await getStatisticVersions('kpi', prismaMock)

      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getReleaseVersions', () => {
    test('throws 404 when release not found', async () => {
      prismaMock.release.findFirst.mockResolvedValue(null)

      await expect(getReleaseVersions(999, prismaMock)).rejects.toThrow(
        expect.objectContaining({ statregError: "Release '999' not found", status: 404 })
      )
    })

    test('returns versions when release found', async () => {
      prismaMock.release.findFirst.mockResolvedValue({ id: 1 })

      const result = await getReleaseVersions(1, prismaMock)

      expect(Array.isArray(result)).toBe(true)
    })
  })
})
