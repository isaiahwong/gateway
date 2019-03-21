import { NotFound } from '../libs/errors';

export default function NotFoundMiddleware(req, res, next) {
  return next(new NotFound());
}
