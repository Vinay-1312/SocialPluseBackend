import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleService } from './database/drizzle.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, DrizzleService],
  exports: [DrizzleService], // export so other modules can use it
})
export class AppModule {}
