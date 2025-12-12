import { Test, TestingModule } from '@nestjs/testing';
import { ExampleController } from './example.controller';
import { ExampleService } from './example.service';

describe('ExampleController', () => {
  let controller: ExampleController;
  let service: ExampleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExampleController],
      providers: [
        {
          provide: ExampleService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn()
          }
        }
      ]
    }).compile();

    controller = module.get<ExampleController>(ExampleController);
    service = module.get<ExampleService>(ExampleService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of examples', async () => {
      const examples = [{ name: 'Test', description: 'Test description' }];
      jest.spyOn(service, 'findAll').mockResolvedValue(examples as any);

      expect(await controller.findAll()).toBe(examples);
    });
  });

  describe('findOne', () => {
    it('should return a single example', async () => {
      const example = { name: 'Test', description: 'Test description' };
      jest.spyOn(service, 'findOne').mockResolvedValue(example as any);

      expect(await controller.findOne('123')).toBe(example);
    });
  });
});
