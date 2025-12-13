import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Fact, FactSchema } from './schemas/fact.schema';
import { FactsService } from './facts.service';
import { FactsIngestor } from './facts.ingestor';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Fact.name, schema: FactSchema }]),
  ],
  providers: [FactsService, FactsIngestor],
  exports: [FactsService],
})
export class FactsModule {}
