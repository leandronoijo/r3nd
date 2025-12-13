import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Fact } from './schemas/fact.schema';

interface UselessFactApiResponse {
  id: string;
  text: string;
  source: string;
  source_url: string;
  language: string;
  permalink: string;
}

@Injectable()
export class FactsService {
  constructor(@InjectModel(Fact.name) private factModel: Model<Fact>) {}

  async ingestBatch(size = 5): Promise<number> {
    let newInserts = 0;

    for (let i = 0; i < size; i++) {
      try {
        const response = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random');
        if (!response.ok) {
          console.error(`Failed to fetch fact: ${response.status}`);
          continue;
        }

        const data: UselessFactApiResponse = await response.json();

        const existingFact = await this.factModel.findOne({ externalId: data.id }).exec();
        if (!existingFact) {
          await this.factModel.create({
            externalId: data.id,
            text: data.text,
            source: data.source,
            sourceUrl: data.source_url,
            language: data.language,
            permalink: data.permalink,
          });
          newInserts++;
        }
      } catch (error) {
        console.error('Error ingesting fact:', error);
      }
    }

    return newInserts;
  }

  async getRandom(): Promise<Fact> {
    const facts = await this.factModel.aggregate([{ $sample: { size: 1 } }]).exec();

    if (facts.length === 0) {
      await this.ingestBatch(5);
      const retryFacts = await this.factModel.aggregate([{ $sample: { size: 1 } }]).exec();
      
      if (retryFacts.length === 0) {
        throw new NotFoundException('No facts available');
      }
      
      return retryFacts[0];
    }

    return facts[0];
  }
}
