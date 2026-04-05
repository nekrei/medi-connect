// Set required environment variables before any module is loaded
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
process.env.AUTH_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';
process.env.AUTH_COOKIE_NAME = 'test_session';
process.env.NODE_ENV = 'test';
