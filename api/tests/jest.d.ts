/// <reference types="jest" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      DATABASE_URL?: string;
      CORS_ORIGIN?: string;
      MAX_FILE_SIZE?: string;
    }
  }
}

export {};
