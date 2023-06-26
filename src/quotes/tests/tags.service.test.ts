import * as TagService from '../tags.service'
import prismaMock from 'lib/__mocks__/prisma'
import randomColor from 'randomcolor'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('lib/prisma')
vi.mock('randomcolor', () => ({
  default: vi.fn(() => `#ffffff`)
}))

describe('tags.service', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  describe('upsertTags', () => {
    it('should return a list of tagIds', async () => {
      prismaMock.$transaction.mockResolvedValueOnce([1, 2, 3])

      const tagIds = await TagService.upsertTags(['tag1', 'tag2', 'tag3'])

      expect(tagIds).toStrictEqual([1, 2, 3])
    })
    it('should only create tags that do not already exist', async () => {
      // Mock the '$transaction' function and configure it to use the mocked Prisma Client
      prismaMock.$transaction.mockImplementationOnce(callback =>
        callback(prismaMock)
      )

      // Mock the first invocation of 'findMany'
      prismaMock.tag.findMany.mockResolvedValueOnce([
        { id: 1, name: `tag1`, color: `#ffffff` }
      ])

      // Mock the resolved value of 'createMany' to avoid invoking the real function
      prismaMock.tag.createMany.mockResolvedValueOnce({ count: 0 })

      // Invoke 'upsertTags' with three tags, including `'tag1'`
      await TagService.upsertTags(['tag1', 'tag2', 'tag3'])

      // Ensure that only `'tag2'` and `'tag3'` are provided to 'createMany'
      expect(prismaMock.tag.createMany).toHaveBeenCalledWith({
        data: [
          { name: 'tag2', color: '#ffffff' },
          { name: `tag3`, color: '#ffffff' }
        ]
      })
    })
    it('should give the tags random colors', async () => {
      // Again, configuration the '$transaction' function to use the mocked client
      prismaMock.$transaction.mockImplementationOnce(callback =>
        callback(prismaMock)
      )

      // Ensure there are no existing tags found
      prismaMock.tag.findMany.mockResolvedValue([])

      // Mock the resolved value of 'createMany' so the real function isn't invoked
      prismaMock.tag.createMany.mockResolvedValueOnce({ count: 3 })

      // Invoke the function with three new tags
      await TagService.upsertTags(['tag1', 'tag2', 'tag3'])

      // Validate the 'randomColor' function was called three times
      expect(randomColor).toHaveBeenCalledTimes(3)
    })
    it('should find and return new tagIds when creating tags', async () => {
      prismaMock.$transaction.mockImplementationOnce(callback =>
        callback(prismaMock)
      )
      // Simulate finding an existing tag
      prismaMock.tag.findMany.mockResolvedValueOnce([
        { id: 1, name: 'tag1', color: '#ffffff' }
      ])
      prismaMock.tag.createMany.mockResolvedValueOnce({ count: 3 })
      // Simulate finding two newly created tags
      prismaMock.tag.findMany.mockResolvedValueOnce([
        { id: 2, name: 'tag2', color: '#ffffff' },
        { id: 3, name: 'tag3', color: '#ffffff' }
      ])
      // Invoke the function with three tags
      await TagService.upsertTags(['tag1', 'tag2', 'tag3'])
      // Expect the transaction to have returned with all of the ids
      expect(prismaMock.$transaction).toHaveReturnedWith([1, 2, 3])
    })
    it('should return an empty array if no tags passed', async () => {
      prismaMock.$transaction.mockImplementationOnce(callback =>
        callback(prismaMock)
      )

      // Ensure that all 'findMany' and 'createMany' invocations return empty results
      prismaMock.tag.findMany.mockResolvedValueOnce([])
      prismaMock.tag.createMany.mockResolvedValueOnce({ count: 0 })
      prismaMock.tag.findMany.mockResolvedValueOnce([])
      // Invoke 'upsertTags' with no tag names
      await TagService.upsertTags([])
      // Ensure an empty array is returned
      expect(prismaMock.$transaction).toHaveReturnedWith([])
    })
  })
})
