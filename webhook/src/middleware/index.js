import bodyParser from 'body-parser';

import routes from './routes';
import notFound from './notFound';
import errorHandler from './errorHandler';
import responseHandler from './responseHandler';

export default async function attachMiddlewares(app) {
  app.use(responseHandler);
  app.use(bodyParser.json());

  app.use('/', routes);

  app.use(notFound);
  app.use(errorHandler);
}
