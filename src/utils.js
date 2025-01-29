const fs = require('fs');
const path = require('path');

module.exports.parseUrlParams = function parseUrlParams (urlParams) {
  let result = {};
  if (!urlParams) {
    return result;
  }

  const splitted = urlParams.substring(1).split('&');
  for (let index = 0 ; index < splitted.length ; ++index) {
    const splittedParam = splitted[index].split('=');
    const key = splittedParam[0];
    const value = splittedParam[1] === undefined ? true : decodeURIComponent(splittedParam[1]);

    if (result[key]) {
      if (result[key].push) {
        result[key].push(value);
      } else {
        result[key] = [result[key], value];
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

module.exports.readFile = function (file) {
  return new Promise(function (resolve, reject) {
    fs.readFile(file, function (error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}
