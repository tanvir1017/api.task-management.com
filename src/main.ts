import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { execSync } from 'node:child_process';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AppModule } from './main/app.module';
import { AuthService } from './modules/auth/auth.service';

async function bootstrap() {
  try {
    execSync('pnpm db:deploy', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Database migration failed during startup:', error);
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);
  const authService = app.get(AuthService);

  await authService.ensureSystemAdmin();

  // Enable CORS with allowed origins from environment variable or default to localhost
  app.enableCors({
    origin: process.env.CORS_ALLOWED_ORIGIN?.split(',') ?? [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:4975',
      'http://143.198.215.14:4975',
      'http://72.62.246.104:4975',
    ],
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Task Management API')
    .setDescription('RESTful API for task management system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  const PORT = process.env.APP_HTTP_PORT || 4975;
  await app.listen(PORT);

  console.log(`✅ Application is running on: http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('❌ Application failed to start:', err);
  process.exit(1);
});
