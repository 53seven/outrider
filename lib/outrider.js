// outrider.js
var path = require('path');
var bunyan = require('bunyan');
var pkginfo = require('pkginfo');

var loggers = {};

// figure out what our main module is so that we can know the correct file name to use
var baseName;
if (!require.main) {
  console.warn('No main module, not logging to a file');
} else {
  baseName = getFileName(require.main);
}

module.exports = function(name, version) {
  if (typeof name === 'object') {
    version = name.version;
    name = name.name;
  }

  var loggerKey = name + '@' + version;

  if (loggers[loggerKey]) {
    return loggers[loggerKey];
  }

  // force a version if the logger has not been created yet
  if (!version) {
    throw new Error('Creating a new logger, but no package version was supplied');
  }

  // create the logging stream based on the name of the process
  var loggingStreams = [{
    level: 'info',
    stream: process.stdout
  }];

  if (baseName) {
    var logLocation = process.env.NODE_LOG_LOCATION ? process.env.NODE_LOG_LOCATION : './';

    loggingStreams.push({
      level: 'trace',
      path: path.join(logLocation, baseName + '.log')
    });
  }

  loggers[loggerKey] = bunyan.createLogger({
    name: loggerKey,
    streams: loggingStreams
  });

  return loggers[loggerKey];
};


function getFileName(module) {
  var pkg = pkginfo.read(module);
  var name = (pkg && pkg.package && pkg.package.name) ? pkg.package.name : path.basename(require.main.filename);
  return sanitizeName(name);
}

function sanitizeName(name) {
  var parts = name.split('/');
  if (parts.length === 1) {
    // normal name
    return parts[0];
  } else {
    // we have a scoped module, drop the first part
    if (parts[0].indexOf('@') === 0) {
      parts.shift();
    }
    return parts.join('-');
  }
}
