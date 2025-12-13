import { Test, TestingModule } from '@nestjs/testing';
import { GreetingsService } from './greetings.service';
import { FactsService } from '../facts/facts.service';

describe('GreetingsService', () => {
  let service: GreetingsService;
  let factsService: FactsService;

  const mockFact = {
    externalId: '123',
    text: 'Test fact',
    source: 'test',
    sourceUrl: 'http://test.com',
    language: 'en',
    permalink: 'http://test.com/fact',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockFactsService = {
      getRandom: jest.fn().mockResolvedValue(mockFact),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GreetingsService,
        {
          provide: FactsService,
          useValue: mockFactsService,
        },
      ],
    }).compile();

    service = module.get<GreetingsService>(GreetingsService);
    factsService = module.get<FactsService>(FactsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return greeting with fact', async () => {
    const result = await service.hello();

    expect(result).toEqual({
      greeting: 'Hello from R3ND',
      fact: {
        text: 'Test fact',
        language: 'en',
        source: 'test',
        permalink: 'http://test.com/fact',
      },
    });
    expect(factsService.getRandom).toHaveBeenCalled();
  });
});
