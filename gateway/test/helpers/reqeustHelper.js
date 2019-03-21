import axios from 'axios';

const API_TEST_PORT = process.env.PORT;

let apiVersion;

// Sets up an object that can make all REST requests
// If a user is passed in, the user is used to make the requests
export default function requestHelper(user = {}) {
  return {
    get: _requestBuilder(user, 'get'),
    post: _requestBuilder(user, 'post'),
    put: _requestBuilder(user, 'put'),
    del: _requestBuilder(user, 'del'),
  };
}

requestHelper.setApiVersion = (version) => {
  apiVersion = version;
};

function _requestBuilder(user, method) {
  if (!apiVersion) throw new Error('apiVersion not set');

  return (route, data, params) => {
    return new Promise((resolve, reject) => {
      let url = `http://localhost:${API_TEST_PORT}`;
      
      // Do not prefix with api/apiVersion requests to top level routes like payments and emails
      if (route.indexOf('/email') === 0 || route.indexOf('/paypal') === 0 || route.indexOf('/stripe') === 0) {
        url += `${route}`;
      } 
      else {
        url += `/api/${apiVersion}${route}`;
      }

      // Execute requests and resolves it
      axios({
        method: method,
        url: url,
        data,
        params,
      })
        .then(res => 
          resolve(_parseRes(res))
        )
        .catch(err => 
          reject(!err.response ? err : _parseError(err))
        );
    });
  };
}

function _parseRes(res) {
  // Based on axios docs https://github.com/axios/axios#response-schema
  return {
    ...res.data
  };
}

function _parseError(err) {
  return {
    code: err.response.status,
    error: err.response.data.error,
    message: err.response.data.message,
  };
}