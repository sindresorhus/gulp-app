'use strict';
var path = require('path');
var execFile = require('child_process').execFile;
var _ = require('lodash');

var gulpPath = path.join(__dirname, 'node_modules', 'gulp', 'bin', 'gulp.js');

module.exports = function (cb) {
	execFile('node', [gulpPath, '--tasks-simple'], function (err, stdout) {
		if (err) {
			return cb(err);
		}

		var tasks = stdout.trim().split('\n');

		tasks = _.pull(tasks, 'default');
		tasks.unshift('default');

		cb(null, tasks);
	});
};
