'use strict';
var path = require('path');
var execFile = require('child_process').execFile;
var _ = require('lodash');

var gulpPath = path.join(__dirname, 'node_modules', 'gulp', 'bin', 'gulp.js');
var re = /] (?:├|└)─[^\w]+(\w+)/g;

module.exports = function (options, cb) {
	var args = ['--tasks', '--no-color'];
	if ('yes' == options.config_coffee){
		args = args.concat('--require','coffee-script/register');
	}
	execFile(gulpPath, args, function (err, stdout) {
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
