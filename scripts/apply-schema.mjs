/* global console, process */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required to apply db/schema.sql.');
  process.exit(1);
}

const rootDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const schemaPath = path.join(rootDirectory, 'db', 'schema.sql');
const schemaSql = await readFile(schemaPath, 'utf8');
const pool = new pg.Pool({ connectionString: databaseUrl });

try {
  await pool.query(schemaSql);
  console.log('Applied db/schema.sql successfully.');
} finally {
  await pool.end();
}
