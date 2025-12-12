import { Module } from '@nestjs/common';
import { GreetingsController } from './greetings.controller';
import { GreetingsService } from './greetings.service';
import { FactsModule } from '../facts/facts.module';

@Module({
  imports: [FactsModule],
  controllers: [GreetingsController],
  providers: [GreetingsService]
})
export class GreetingsModule {}
