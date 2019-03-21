import cors from 'cors';

const whitelist = [process.env.DOMAIN, `http://localhost:${process.env.PORT}`];

const corsOptions = {
  origin: (origin, cb) => {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      cb(null, true);
    } 
    else {
      cb(new Error('Not allowed by CORS'));
    }
  }
};

export default app => app.use(cors(corsOptions));