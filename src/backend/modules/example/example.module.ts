import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExampleController } from './example.controller';
import { ExampleService } from './example.service';
import { Example, ExampleSchema } from './schemas/example.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Example.name, schema: ExampleSchema }])
  ],
  controllers: [ExampleController],
  providers: [ExampleService],
  exports: [ExampleService]
})
export class ExampleModule {}
