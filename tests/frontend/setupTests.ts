import '@testing-library/jest-dom/vitest';
import './setup/msw-server';

beforeAll(() => {
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
});
