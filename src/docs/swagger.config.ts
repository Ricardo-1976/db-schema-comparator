import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('DB Schema Comparator')
    .setDescription(
      'API para comparar schemas PostgreSQL entre dois bancos. ' +
        'Retorna JSON ou relatório PDF com diferenças estruturais (Nível 1).',
    )
    .setVersion('1.0')
    .addTag('compare', 'Comparação de schemas PostgreSQL')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs/openapi.json',
  });
}
