import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { FactsService } from './facts.service';
import { Fact } from './schemas/fact.schema';

describe('FactsService', () => {
  let service: FactsService;
  let mockFactModel: any;

  const mockFact = {
    externalId: '123',
    text: 'Test fact',
    source: 'test',
    sourceUrl: 'http://test.com',
    language: 'en',
    permalink: 'http://test.com/fact',
  };

  beforeEach(async () => {
    mockFactModel = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn(),
      }),
      create: jest.fn(),
      aggregate: jest.fn().mockReturnValue({
        exec: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FactsService,
        {
          provide: getModelToken(Fact.name),
          useValue: mockFactModel,
        },
      ],
    }).compile();

    service = module.get<FactsService>(FactsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ingestBatch', () => {
    it('should insert new facts and return count', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: '123',
          text: 'Test fact',
          source: 'test',
          source_url: 'http://test.com',
          language: 'en',
          permalink: 'http://test.com/fact',
        }),
      }) as any;

      mockFactModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockFactModel.create.mockResolvedValue(mockFact);

      const count = await service.ingestBatch(1);
      expect(count).toBe(1);
      expect(mockFactModel.create).toHaveBeenCalled();
    });

    it('should skip duplicate facts', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: '123',
          text: 'Test fact',
          source: 'test',
          source_url: 'http://test.com',
          language: 'en',
          permalink: 'http://test.com/fact',
        }),
      }) as any;

      mockFactModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockFact),
      });

      const count = await service.ingestBatch(1);
      expect(count).toBe(0);
      expect(mockFactModel.create).not.toHaveBeenCalled();
    });

    it('should handle fetch errors gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }) as any;

      const count = await service.ingestBatch(1);
      expect(count).toBe(0);
    });
  });

  describe('getRandom', () => {
    it('should return a random fact', async () => {
      mockFactModel.aggregate.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockFact]),
      });

      const fact = await service.getRandom();
      expect(fact).toEqual(mockFact);
    });

    it('should warm up with facts if empty and retry', async () => {
      let callCount = 0;
      mockFactModel.aggregate.mockReturnValue({
        exec: jest.fn().mockImplementation(() => {
          callCount++;
          return Promise.resolve(callCount === 1 ? [] : [mockFact]);
        }),
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: '123',
          text: 'Test fact',
          source: 'test',
          source_url: 'http://test.com',
          language: 'en',
          permalink: 'http://test.com/fact',
        }),
      }) as any;

      mockFactModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockFactModel.create.mockResolvedValue(mockFact);

      const fact = await service.getRandom();
      expect(fact).toEqual(mockFact);
    });

    it('should throw NotFoundException if no facts after warmup', async () => {
      mockFactModel.aggregate.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }) as any;

      await expect(service.getRandom()).rejects.toThrow(NotFoundException);
    });
  });
});
