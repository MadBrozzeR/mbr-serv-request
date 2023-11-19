const { HEADER, MIME } = require('./constants.js');
const utils = require('./utils.js');
const { Url } = require('./url.js');
const http = require('http');

const empty = {};

const COOKIE_RE = /([^=]+)=(.+?)(?:; |$)/g;

function Request (request, response) {
  this.request = request;
  this.response = response;
  this.ip = request.socket.remoteAddress;
  this.port = request.socket.remotePort;
  this.headers = {};
  this.cookies = null;
  this.status = 200;
}

Request.prototype.valueOf = Request.prototype.toJSON = function () {
    return {
        request: {
            url: this.request.url,
            method: this.request.url,
            httpVersion: this.request.httpVersion,
            headers: this.request.headers,
            statusCode: this.request.statusCode,
            statusMessage: this.request.statusMessage,
            trailers: this.request.trailers,
            upgrade: this.request.upgrade
        },
        ip: this.ip,
        port: this.port,
        headers: this.headers,
        status: this.status,
    }
};

Request.prototype.getData = function (callback) {
  const cache = [];
  let length = 0;

  return new Promise(function (resolve) {
    this.request.on('data', function (data) {cache.push(data); length += data.length;});
    this.request.on('end', function () {
      resolve(Buffer.concat(cache, length));
    });
  });
};

Request.prototype.getCookies = function () {
  if (!this.cookies) {
    this.cookies = {};

    if (this.request.headers[HEADER.COOKIE]) {
      let regMatch;
      while (regMatch = COOKIE_RE.exec(this.request.headers[HEADER.COOKIE])) {
        this.cookies[regMatch[1]] = decodeURIComponent(regMatch[2]);
      }
    };
  }

  return this.cookies;
};

Request.prototype.getCookie = function (name) {
  return this.getCookies()[name];
};

const SET_COOKIE_HEADER = 'Set-Cookie';

Request.prototype.setCookie = function (name, value, options) {
  if (!this.headers[HEADER.SET_COOKIE]) {
    this.headers[HEADER.SET_COOKIE] = [];
  }

  options || (options = empty);
  let newCookie = name + '=' + encodeURIComponent(value);
  (options.expires instanceof Date) && (newCookie += '; Expires=' + options.expires.toUTCString());
  (options.maxAge !== undefined) && (newCookie += '; Max-Age=' + options.maxAge);
  options.domain && (newCookie += '; Domain=' + options.domain);
  options.path && (newCookie += '; Path="' + options.path + '"');
  options.secure && (newCookie += '; Secure');
  options.httpOnly && (newCookie += '; HttpOnly');

  this.headers[HEADER.SET_COOKIE].push(newCookie);
};

Request.prototype.delCookie = function (name) {
  const expires = new Date();
  expires.setDate(-1);
  this.setCookie(name, '', {expires: expires});
}

Request.prototype.match = function (regExp, callback) {
  const regMatch = regExp.exec(this.getPath());
  if (regMatch && callback) {
    callback.call(this, regMatch, this);
  }
  return regMatch;
};

Request.prototype.send = function (data = '', ext) {
  if (ext) {
    this.headers[HEADER.CONTENT_TYPE] = MIME[ext] || MIME.octet;
  }
  this.headers[HEADER.CONTENT_LENGTH] = Buffer.byteLength(data);
  this.response.writeHead(this.status, this.headers);
  this.response.end(data);
};

Request.prototype.route = function (router) {
  const url = this.getUrl();
  const route = router[url.getPath()] || router.default;
  const request = this;

  if (!route) {
    return;
  }

  if (route instanceof Function) {
    route.call(this, this);
    return true;
  }
  if (this.request.method = 'GET' && typeof route === 'string') {
    utils.readFile(route)
      .then(function (data) {
        request.send(data, url.getExtension());
      })
      .catch(function () {
        request.status = 404;
        request.send();
      });

    return true;
  }

  if (route[this.request.method] instanceof Function) {
    route[this.request.method].call(this, this);
    return true;
  }

  this.status = 405;
  this.headers.Allow = Object.keys(route).join(', ');
  this.send();

  return true;
}

Request.prototype.simpleServer = Request.prototype.serve = function (options) {
  if (!options || !options.root) {
    return;
  }

  const request = this;

  let url = this.getUrl();
  if (url.getPath() === '/') {
    url = this.getUrl(options.index || '/index.html');
  }

  const normalPath = url.normalize(options.root);

  if (!normalPath) {
    console.log('ERROR: Out of root (' + url.getPath() + ')');
    this.status = 404;
    this.send();

    return;
  }

  utils.readFile(normalPath)
    .then(function (data) {
      const extension = url.getExtension();
      request.send(data, extension);
    })
    .catch(function () {
      request.status = 404;
      request.send();
    });
}

Request.prototype.proxy = function (props = empty) {
  const origin = this;
  const options = {
    hostname: props.hostname || 'localhost',
    port: props.port || 80,
    path: props.path || origin.request.url,
    method: props.method || origin.request.method,
    headers: props.headers || origin.request.headers
  };
  const request = http.request(options, function (response) {
    origin.response.writeHead(response.statusCode, response.headers);
    response.pipe(origin.response, {end: true});
  });

  origin.request.pipe(request, { end: true });
}

Request.prototype.getHost = function getHost () {
  let host = this.request.headers.host;

  if (host) {
    const colonPos = host.indexOf(':');

    if (host && colonPos > -1) {
      host = host.substr(0, colonPos);
    }

    return host;
  } else {
    return undefined;
  }
};

Request.prototype.redirect = function (path, status = 307) {
  this.status = status;
  this.headers.Location = path;
  this.send();
};

Request.prototype.getUrl = function (path) {
  return new Url(path || this.request.url);
};

module.exports = Request;
