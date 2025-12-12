import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { FactsService } from './facts.service';
import { Fact } from './schemas/fact.schema';

global.fetch = jest.fn();

describe('FactsService', () => {
  let service: FactsService;
  let mockModel: any;

  beforeEach(async () => {
    mockModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FactsService,
        {
          provide: getModelToken(Fact.name),
          useValue: mockModel
        }
      ]
    }).compile();

    service = module.get<FactsService>(FactsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ingestBatch', () => {
    it('should insert new facts and return count', async () => {
      const mockFact = {
        id: '123',
        text: 'Test fact',
        source: 'test',
        source_url: 'http://test.com',
        language: 'en',
        permalink: 'http://test.com/fact'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockFact
      });

      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });
      mockModel.create.mockResolvedValue(mockFact);

      const count = await service.ingestBatch(1);
      expect(count).toBe(1);
      expect(mockModel.create).toHaveBeenCalledTimes(1);
    });

    it('should skip duplicate facts', async () => {
      const mockFact = {
        id: '123',
        text: 'Test fact',
        source: 'test',
        source_url: 'http://test.com',
        language: 'en',
        permalink: 'http://test.com/fact'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockFact
      });

      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockFact)
      });

      const count = await service.ingestBatch(1);
      expect(count).toBe(0);
      expect(mockModel.create).not.toHaveBeenCalled();
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const count = await service.ingestBatch(1);
      expect(count).toBe(0);
    });
  });

  describe('getRandom', () => {
    it('should return a random fact', async () => {
      const mockFact = { text: 'Random fact', language: 'en' };
      mockModel.aggregate.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockFact])
      });

      const result = await service.getRandom();
      expect(result).toEqual(mockFact);
    });

    it('should warm up and retry if no facts exist', async () => {
      const mockFact = { text: 'New fact', language: 'en' };
      
      mockModel.aggregate
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue([])
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue([mockFact])
        });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: '456',
          text: 'New fact',
          source: 'test',
          source_url: 'http://test.com',
          language: 'en',
          permalink: 'http://test.com/fact'
        })
      });

      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });
      mockModel.create.mockResolvedValue(mockFact);

      const result = await service.getRandom();
      expect(result).toEqual(mockFact);
    });

    it('should throw NotFoundException if warmup fails', async () => {
      mockModel.aggregate.mockReturnValue({
        exec: jest.fn().mockResolvedValue([])
      });

      (global.fetch as jest.Mock).mockRejectedValue(new Error('API down'));

      await expect(service.getRandom()).rejects.toThrow(NotFoundException);
    });
  });
});
