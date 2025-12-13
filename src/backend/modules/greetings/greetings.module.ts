import { Module } from '@nestjs/common';
import { FactsModule } from '../facts/facts.module';
import { GreetingsService } from './greetings.service';
import { GreetingsController } from './greetings.controller';

@Module({
  imports: [FactsModule],
  providers: [GreetingsService],
  controllers: [GreetingsController],
})
export class GreetingsModule {}
