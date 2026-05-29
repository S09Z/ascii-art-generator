import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from './server';

describe('GET /api/health', () => {
  it('returns 200 with ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/charsets', () => {
  it('returns 200 with an array of charsets', async () => {
    const res = await request(app).get('/api/charsets');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('each charset has label and chars fields', async () => {
    const res = await request(app).get('/api/charsets');
    for (const charset of res.body) {
      expect(charset).toHaveProperty('label');
      expect(charset).toHaveProperty('chars');
      expect(typeof charset.label).toBe('string');
      expect(typeof charset.chars).toBe('string');
    }
  });
});
