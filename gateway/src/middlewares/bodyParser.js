import bodyParser from 'body-parser';

export default function (app) {
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(
    bodyParser.json({
      verify(req, res, buf) {
        if (req.originalUrl && req.originalUrl.includes('/webhook')) {
          req.buf = buf;
        }
      },
    })
  );
}
