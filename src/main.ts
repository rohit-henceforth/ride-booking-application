import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AdminService } from './modules/admin/admin.service';
import { ErrorModuleService } from './common/logs/error_module/error_module.service';
import { AllExceptionsFilter } from './common/filters/error.filter';
import {raw} from 'express' ;

async function bootstrap() {
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use('/stripe/webhook', raw({ type: 'application/json' }));

  // setup errorFilter
  const errorLogService = app.get(ErrorModuleService);
  app.useGlobalFilters(new AllExceptionsFilter(errorLogService));


  // setup validation pipeline
  app.useGlobalPipes(new ValidationPipe());

  // setup static folder path
  app.useStaticAssets(join(__dirname, '..', 'uploads'));

  // seeding super admin data
  app.get(AdminService).seedSuperAdminData();

  // cors setup
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  // swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ride booking application APIs')
    .setDescription('This is ride booking application APIs!')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  // setup swagger document
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);

}

bootstrap();