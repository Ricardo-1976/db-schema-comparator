import { SchemaExtractorPort } from '../../domain/ports/schema-extractor.port';

export class ExtractSchemaUseCase {
  constructor(private extractor: SchemaExtractorPort) {}

  async execute(config: any) {
    return this.extractor.extract(config);
  }
}
