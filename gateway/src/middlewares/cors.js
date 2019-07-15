import cors from 'cors';
import { NotAuthorized } from 'horeb';

const whitelist = [
  process.env.DOMAIN,
  process.env.FRONT_END,
  process.env.DEV_CLIENT,
  `http://localhost:${process.env.PORT}`,
];

const corsOptions = {
  origin: (origin, cb) => {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      cb(null, true);
    }
    else {
      cb(new NotAuthorized());
    }
  }
};

export default app => app.use(cors(corsOptions));
