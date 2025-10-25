declare module 'serverless-http' {
  import { Application, Handler } from 'express';

  interface Options {
    request?: any;
    response?: any;
    binary?: string | string[] | boolean;
  }

  function serverless(app: Application, options?: Options): Handler;
  export default serverless;
}
