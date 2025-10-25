#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { swaggerSpec } from '../src/swagger/config';

const outputDir = path.join(process.cwd(), 'openapi');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate JSON file
const jsonPath = path.join(outputDir, 'openapi.json');
fs.writeFileSync(jsonPath, JSON.stringify(swaggerSpec, null, 2));
console.log(`✅ Generated OpenAPI JSON: ${jsonPath}`);

// Generate YAML file
const yamlPath = path.join(outputDir, 'openapi.yaml');
const yamlContent = yaml.dump(swaggerSpec);
fs.writeFileSync(yamlPath, yamlContent);
console.log(`✅ Generated OpenAPI YAML: ${yamlPath}`);

console.log('\n📚 OpenAPI documentation generated successfully!');
console.log('   - JSON format: openapi/openapi.json');
console.log('   - YAML format: openapi/openapi.yaml');
console.log('\n🔧 These files can be used with:');
console.log('   - Orval for TypeScript client generation');
console.log('   - OpenAPI Generator for client SDKs');
console.log('   - Postman/Insomnia for API testing');
console.log('   - Any OpenAPI 3.0 compatible tools');
