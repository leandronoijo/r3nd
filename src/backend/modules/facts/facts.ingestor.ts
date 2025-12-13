import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FactsService } from './facts.service';

@Injectable()
export class FactsIngestor {
  private readonly logger = new Logger(FactsIngestor.name);

  constructor(private readonly factsService: FactsService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyIngestion() {
    this.logger.log('Starting hourly facts ingestion...');
    const count = await this.factsService.ingestBatch(5);
    this.logger.log(`Ingested ${count} new facts`);
  }
}
