import { Request } from 'express';

 declare module 'express' {
  export interface Request {
    user?: {
      id: string;
      email: string;
    };
  }
} 

  /* declare namespace Express {
  export interface Request {
      user: any;
  }
  export interface Response {
      user: any;
  }
} */