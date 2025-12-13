import { Controller, Get } from '@nestjs/common';
import { GreetingsService } from './greetings.service';

@Controller('greetings')
export class GreetingsController {
  constructor(private readonly greetingsService: GreetingsService) {}

  @Get()
  async hello() {
    return this.greetingsService.hello();
  }
}
