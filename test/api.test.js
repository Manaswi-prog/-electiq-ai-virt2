import test from 'node:test';
import assert from 'node:assert';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

test('ElectIQ Integration Tests', async (t) => {
  // Spawn the server as a child process
  const server = spawn('node', ['server.js'], { cwd: rootDir });
  
  // Give the server 2 seconds to initialize and bind to PORT 8080
  await new Promise(resolve => setTimeout(resolve, 2000));

  await t.test('GET /api/health should return healthy status', async () => {
    const res = await fetch('http://localhost:8080/api/health');
    assert.strictEqual(res.status, 200, 'Health endpoint should return 200 OK');
    const data = await res.json();
    assert.strictEqual(data.status, 'healthy', 'Status should be healthy');
    assert.ok('ai' in data, 'Response should indicate AI availability');
  });

  await t.test('GET /api/topics should return list of quick topics', async () => {
    const res = await fetch('http://localhost:8080/api/topics');
    assert.strictEqual(res.status, 200, 'Topics endpoint should return 200 OK');
    const data = await res.json();
    assert.ok(Array.isArray(data.topics), 'Topics should be an array');
    assert.strictEqual(data.topics.length, 8, 'Should return exactly 8 election topics');
    assert.ok(data.topics[0].id, 'Topic should have an ID');
  });

  await t.test('POST /api/chat without message should return 400 Bad Request', async () => {
    const res = await fetch('http://localhost:8080/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'en' }) // Missing message
    });
    assert.strictEqual(res.status, 400, 'Chat endpoint should reject empty messages with 400');
    const data = await res.json();
    assert.strictEqual(data.error, 'Message is required', 'Should return validation error');
  });

  await t.test('POST /api/quiz should return an array of 5 questions (Fallback/Live)', async () => {
    const res = await fetch('http://localhost:8080/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'en' })
    });
    assert.strictEqual(res.status, 200, 'Quiz endpoint should return 200 OK');
    const data = await res.json();
    assert.ok(Array.isArray(data), 'Quiz should return an array');
    assert.strictEqual(data.length, 5, 'Quiz should contain exactly 5 questions');
    assert.ok(data[0].q, 'Question object should contain a question text (q)');
    assert.ok(Array.isArray(data[0].options), 'Question should contain options array');
  });

  // Cleanup: Kill the child process after tests
  server.kill();
});
