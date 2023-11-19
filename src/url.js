const path = require('path');
const utils = require('./utils.js');

function Url (url) {
  this.url = (url[0] !== '/' ? '/' : '') + url;
  this.path;
  this.search;
  this.params;
  this.fileName;
  this.extension;
  this.directory;
};
Url.prototype.getPath = function () {
  if (!this.path) {
    const splitted = this.url.split('?');
    this.path = splitted[0];
    this.search = splitted[1];
  }
  return this.path;
};
Url.prototype.getParams = function () {
  if (!this.params) {
    this.getPath();
    this.params = utils.parseUrlParams(this.search);
  }

  return this.params;
};
Url.prototype.getFileName = function () {
  if (!this.fileName) {
    const path = this.getPath();
    const slashPos = path.lastIndexOf('/');

    this.fileName = slashPos > -1 ? path.substring(slashPos + 1) : path;
  }

  return this.fileName;
}
Url.prototype.getDirectory = function () {
  if (this.directory === undefined) {
    const path = this.getPath();
    const slashPos = path.lastIndexOf('/');

    this.directory = slashPos > -1 ? path.substring(0, slashPos) : '';
  }

  return this.directory;
}
Url.prototype.getExtension = function () {
  if (this.extension === undefined) {
    const name = this.getFileName();
    const dotPos = name.lastIndexOf('.');

    this.extension = dotPos > -1 ? name.substring(dotPos + 1) : null;
  }

  return this.extension;
}
Url.prototype.normalize = function (root) {
  const realRoot = path.resolve(root) + '/';
  const realPath = path.resolve(realRoot + this.getPath());

  return realPath.substring(0, realRoot.length) === realRoot
    ? realPath
    : null;
};

module.exports = { Url };
