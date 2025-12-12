import { Test, TestingModule } from '@nestjs/testing';
import { GreetingsController } from './greetings.controller';
import { GreetingsService } from './greetings.service';

describe('GreetingsController', () => {
  let controller: GreetingsController;
  let service: GreetingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GreetingsController],
      providers: [
        {
          provide: GreetingsService,
          useValue: {
            hello: jest.fn()
          }
        }
      ]
    }).compile();

    controller = module.get<GreetingsController>(GreetingsController);
    service = module.get<GreetingsService>(GreetingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('hello', () => {
    it('should return greeting and fact', async () => {
      const mockResponse = {
        greeting: 'Hello from R3ND',
        fact: {
          text: 'Test fact',
          language: 'en',
          source: 'test',
          permalink: 'http://test.com'
        }
      };

      jest.spyOn(service, 'hello').mockResolvedValue(mockResponse);

      const result = await controller.hello();
      expect(result).toEqual(mockResponse);
      expect(service.hello).toHaveBeenCalled();
    });
  });
});
