import { NextFunction, RequestHandler, Request, Response } from 'express'

export function asyncMiddleware(promiseFn: PromiseFn): RequestHandler {
  return (req, res, next) => {
    promiseFn(req, res, next).catch(next)
  }
}

type PromiseFn = (req: Request, res: Response, next: NextFunction) => Promise<void>
