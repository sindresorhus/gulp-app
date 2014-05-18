'use strict';
var path = require('path');
var execFile = require('child_process').execFile;
var _ = require('lodash');

var gulpPath = path.join(__dirname, 'node_modules', 'gulp', 'bin', 'gulp.js');
var re = /] (?:├|└)─[^\w]+(\w+)/g;

module.exports = function (cb) {
	execFile(gulpPath, ['--tasks', '--no-color'], function (err, stdout) {
		if (err) {
			return cb(err);
		}

		var match;
		var tasks = [];

		while (match = re.exec(stdout)) {
			tasks.push(match[1]);
		}

		tasks = _.pull(tasks, 'default');
		tasks.unshift('default');

		cb(null, tasks);
	});
};
