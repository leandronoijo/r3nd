import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { FactsService } from './facts.service';
import { Fact } from './schemas/fact.schema';

describe('FactsService', () => {
  let service: FactsService;
  let mockFactModel: any;

  const mockFact = {
    externalId: 'test-id-123',
    text: 'This is a test fact',
    source: 'test.com',
    sourceUrl: 'https://test.com',
    language: 'en',
    permalink: 'https://test.com/fact',
  };

  const mockApiResponse = {
    id: 'api-id-456',
    text: 'API fact text',
    source: 'api.com',
    source_url: 'https://api.com',
    language: 'en',
    permalink: 'https://api.com/fact',
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ingestBatch', () => {
    it('should insert new facts from API', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      mockFactModel.findOne().exec.mockResolvedValue(null);
      mockFactModel.create.mockResolvedValue(mockFact);

      const count = await service.ingestBatch(1);

      expect(count).toBe(1);
      expect(mockFactModel.create).toHaveBeenCalledWith({
        externalId: mockApiResponse.id,
        text: mockApiResponse.text,
        source: mockApiResponse.source,
        sourceUrl: mockApiResponse.source_url,
        language: mockApiResponse.language,
        permalink: mockApiResponse.permalink,
      });
    });

    it('should skip duplicate facts', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      mockFactModel.findOne().exec.mockResolvedValue(mockFact);

      const count = await service.ingestBatch(1);

      expect(count).toBe(0);
      expect(mockFactModel.create).not.toHaveBeenCalled();
    });

    it('should handle API failures gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'Server Error',
      } as Response);

      const count = await service.ingestBatch(1);

      expect(count).toBe(0);
    });

    it('should handle network errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const count = await service.ingestBatch(1);

      expect(count).toBe(0);
    });
  });

  describe('getRandom', () => {
    it('should return a random fact', async () => {
      mockFactModel.aggregate().exec.mockResolvedValue([mockFact]);

      const result = await service.getRandom();

      expect(result).toEqual(mockFact);
      expect(mockFactModel.aggregate).toHaveBeenCalledWith([{ $sample: { size: 1 } }]);
    });

    it('should warm up database if empty and retry', async () => {
      mockFactModel.aggregate().exec
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockFact]);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      mockFactModel.findOne().exec.mockResolvedValue(null);
      mockFactModel.create.mockResolvedValue(mockFact);

      const result = await service.getRandom();

      expect(result).toEqual(mockFact);
    });

    it('should throw NotFoundException if database is still empty after warm-up', async () => {
      mockFactModel.aggregate().exec.mockResolvedValue([]);

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'Server Error',
      } as Response);

      await expect(service.getRandom()).rejects.toThrow(NotFoundException);
    });
  });
});
