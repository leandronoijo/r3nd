import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { ExampleService } from './example.service';
import { Example } from './schemas/example.schema';

describe('ExampleService', () => {
  let service: ExampleService;
  let mockModel: any;

  beforeEach(async () => {
    mockModel = {
      new: jest.fn(),
      constructor: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      exec: jest.fn(),
      save: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExampleService,
        {
          provide: getModelToken(Example.name),
          useValue: mockModel
        }
      ]
    }).compile();

    service = module.get<ExampleService>(ExampleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of examples', async () => {
      const examples = [{ name: 'Test', description: 'Test description' }];
      mockModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(examples)
      });

      const result = await service.findAll();
      expect(result).toEqual(examples);
    });
  });

  describe('findOne', () => {
    it('should return an example', async () => {
      const example = { name: 'Test', description: 'Test description' };
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(example)
      });

      const result = await service.findOne('123');
      expect(result).toEqual(example);
    });

    it('should throw NotFoundException if example not found', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(service.findOne('123')).rejects.toThrow(NotFoundException);
    });
  });
});
