import bodyParser from 'body-parser';

export default function (req, res, next) {
  bodyParser.urlencoded({
    extended: false
  })(req, res, next);
  bodyParser.json();
}
