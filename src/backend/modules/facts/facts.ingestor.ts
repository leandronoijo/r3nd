import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FactsService } from './facts.service';

@Injectable()
export class FactsIngestor {
  private readonly logger = new Logger(FactsIngestor.name);

  constructor(private readonly factsService: FactsService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleFactIngestion() {
    this.logger.log('Starting hourly fact ingestion...');
    try {
      const count = await this.factsService.ingestBatch(5);
      this.logger.log(`Ingested ${count} new facts`);
    } catch (error) {
      this.logger.error('Error during fact ingestion:', error);
    }
  }
}
