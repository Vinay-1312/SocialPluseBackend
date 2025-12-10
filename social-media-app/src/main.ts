import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('SocialPulse API')
    .setDescription('SocialPulse API documentation')
    .setVersion('1.0')
    .addBearerAuth() // optional
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // UI at http://localhost:3000/api/docs

  await app.listen(3000);
}
bootstrap();
