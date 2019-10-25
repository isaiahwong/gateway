import cors from 'cors';
import { NotAuthorized } from 'horeb';

const whitelist = [
  process.env.DOMAIN,
  process.env.FRONT_END,
  process.env.DEV_CLIENT,
  `http://localhost:${process.env.PORT}`,
  'http://localhost:3000'
];

const corsOptions = {
  origin: (origin, cb) => {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      cb(null, true);
    }
    else {
      cb(new NotAuthorized());
    }
  },
  methods: ['GET', 'POST'],
  credentials: true,
};

export default (app) => {
  app.use(cors(corsOptions));
};
