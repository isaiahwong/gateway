import { NotFound } from 'horeb';

export default function NotFoundMiddleware(req, res, next) {
  return next(new NotFound());
}
