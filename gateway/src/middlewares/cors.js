import cors from 'cors';
import { NotAuthorized } from '../libs/errors';

const whitelist = [
  process.env.DOMAIN, 
  process.env.DEV_CLIENT,
  `http://localhost:${process.env.PORT}`,
];

const corsOptions = {
  origin: (origin, cb) => {
    console.log(origin)
    if (whitelist.indexOf(origin) !== -1 || (!origin)) {
      cb(null, true);
    } 
    else {
      cb(new NotAuthorized());
    }
  }
};

export default app => app.use(cors(corsOptions));