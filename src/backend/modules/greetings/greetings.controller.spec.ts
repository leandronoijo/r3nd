import { Test, TestingModule } from '@nestjs/testing';
import { GreetingsController } from './greetings.controller';
import { GreetingsService } from './greetings.service';

describe('GreetingsController', () => {
  let controller: GreetingsController;
  let service: GreetingsService;

  const mockGreetingResponse = {
    greeting: 'Hello from R3ND',
    fact: {
      text: 'Test fact',
      language: 'en',
      source: 'test.com',
      permalink: 'https://test.com/fact',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GreetingsController],
      providers: [
        {
          provide: GreetingsService,
          useValue: {
            hello: jest.fn().mockResolvedValue(mockGreetingResponse),
          },
        },
      ],
    }).compile();

    controller = module.get<GreetingsController>(GreetingsController);
    service = module.get<GreetingsService>(GreetingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /greetings', () => {
    it('should return greeting with fact', async () => {
      const result = await controller.hello();

      expect(result).toEqual(mockGreetingResponse);
      expect(service.hello).toHaveBeenCalled();
    });
  });
});
