import { NotFound } from 'esther';

export default function NotFoundMiddleware(req, res, next) {
  return next(new NotFound());
}
