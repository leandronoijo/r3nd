import { Test, TestingModule } from '@nestjs/testing';
import { GreetingsService } from './greetings.service';
import { FactsService } from '../facts/facts.service';

describe('GreetingsService', () => {
  let service: GreetingsService;
  let factsService: FactsService;

  const mockFact = {
    externalId: 'test-id-123',
    text: 'This is a test fact',
    source: 'test.com',
    sourceUrl: 'https://test.com',
    language: 'en',
    permalink: 'https://test.com/fact',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GreetingsService,
        {
          provide: FactsService,
          useValue: {
            getRandom: jest.fn().mockResolvedValue(mockFact),
          },
        },
      ],
    }).compile();

    service = module.get<GreetingsService>(GreetingsService);
    factsService = module.get<FactsService>(FactsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hello', () => {
    it('should return greeting with random fact', async () => {
      const result = await service.hello();

      expect(result).toEqual({
        greeting: 'Hello from R3ND',
        fact: {
          text: mockFact.text,
          language: mockFact.language,
          source: mockFact.source,
          permalink: mockFact.permalink,
        },
      });
      expect(factsService.getRandom).toHaveBeenCalled();
    });

    it('should only include specific fact fields', async () => {
      const result = await service.hello();

      expect(result.fact).not.toHaveProperty('externalId');
      expect(result.fact).not.toHaveProperty('sourceUrl');
      expect(result.fact).not.toHaveProperty('createdAt');
      expect(result.fact).toHaveProperty('text');
      expect(result.fact).toHaveProperty('language');
      expect(result.fact).toHaveProperty('source');
      expect(result.fact).toHaveProperty('permalink');
    });
  });
});
