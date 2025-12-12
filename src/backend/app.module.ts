import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { FactsModule } from './modules/facts/facts.module';
import { GreetingsModule } from './modules/greetings/greetings.module';
import { ExampleModule } from './modules/example/example.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/r3nd')
      })
    }),
    ScheduleModule.forRoot(),
    FactsModule,
    GreetingsModule,
    ExampleModule
  ]
})
export class AppModule {}
