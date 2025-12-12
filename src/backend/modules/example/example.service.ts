import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Example, ExampleDocument } from './schemas/example.schema';
import { CreateExampleDto } from './dto/create-example.dto';

@Injectable()
export class ExampleService {
  constructor(
    @InjectModel(Example.name) private exampleModel: Model<ExampleDocument>
  ) {}

  async create(createExampleDto: CreateExampleDto): Promise<Example> {
    const created = new this.exampleModel(createExampleDto);
    return created.save();
  }

  async findAll(): Promise<Example[]> {
    return this.exampleModel.find().exec();
  }

  async findOne(id: string): Promise<Example> {
    const example = await this.exampleModel.findById(id).exec();
    if (!example) {
      throw new NotFoundException(`Example with ID ${id} not found`);
    }
    return example;
  }
}
