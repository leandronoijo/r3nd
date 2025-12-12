import { Injectable } from '@nestjs/common';
import { FactsService } from '../facts/facts.service';
import { Fact } from '../facts/schemas/fact.schema';

export interface GreetingResponse {
  greeting: string;
  fact: Pick<Fact, 'text' | 'language' | 'source' | 'permalink'>;
}

@Injectable()
export class GreetingsService {
  constructor(private readonly factsService: FactsService) {}

  async hello(): Promise<GreetingResponse> {
    const fact = await this.factsService.getRandom();
    
    return {
      greeting: 'Hello from R3ND',
      fact: {
        text: fact.text,
        language: fact.language,
        source: fact.source,
        permalink: fact.permalink
      }
    };
  }
}
