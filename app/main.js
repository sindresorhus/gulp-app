'use strict';
var path = require('path');
var spawn = require('child_process').spawn;
var gui = require('nw.gui');
var _ = require('lodash');
var findupSync = require('findup-sync');
var finderPath = require('finder-path');
var requireModify = require('require-modify');
var displayNotification = require('display-notification');
var nodeUtil = require('./node-util');
var dirname = nodeUtil.dirname;

var DEBUG = true;
var TRAY_UPDATE_INTERVAL = 1000;

function runTask(taskName) {
	var gulpPath = path.join(dirname, 'node_modules', 'gulp', 'bin', 'gulp.js');

	// TODO: find workaround for node-webkit bug:
	// https://github.com/rogerwang/node-webkit/issues/213
	// so I don't have to hardcode the node path
	var cp = spawn('/usr/local/bin/node', [gulpPath, taskName, '--no-color']);

	cp.stdout.setEncoding('utf8');
	cp.stdout.on('data', function (data) {
		console.log(data);
	});

	// TODO: show progress in menubar menu
	//tray.menu = createTrayMenu(name, [], 'progress here');

	cp.stderr.setEncoding('utf8');
	cp.stderr.on('data', function (data) {
		console.error(data);
		displayNotification({text: '[error] ' + data});
	});

	cp.on('exit', function (code) {
		if (code === 0) {
			displayNotification({
				title: 'gulp',
				subtitle: 'Finished running tasks'
			});
		} else {
			displayNotification({
				title: 'gulp',
				subtitle: 'Exited with error code ' + code,
				sound: 'Basso'
			});
		}
	});
}

function createTrayMenu(name, tasks, status) {
	var menu = new gui.Menu();

	menu.append(new gui.MenuItem({
		label: name,
		enabled: false
	}));

	if (status) {
		menu.append(new gui.MenuItem({type: 'separator'}));
		menu.append(new gui.MenuItem({
			label: status,
			enabled: false
		}));
	}

	if (tasks && tasks.length > 0) {
		menu.append(new gui.MenuItem({type: 'separator'}));

		tasks.forEach(function (el) {
			menu.append(new gui.MenuItem({
				label: el,
				click: function () {
					runTask(el);
				}
			}));
		});
	}

	menu.append(new gui.MenuItem({type: 'separator'}));
	menu.append(new gui.MenuItem({
		label: 'Quit',
		click: gui.App.quit
	}));

	return menu;
}

function updateTrayMenu() {
	tray.menu = createTrayMenu.apply(null, arguments);
}

function updateTray() {
	finderPath(function (err, dirPath) {
		setTimeout(updateTray, TRAY_UPDATE_INTERVAL);

		process.chdir(dirPath);

		try {
			var pkg = require(findupSync('package.json'));
			var name = pkg.name || path.basename(dirPath, path.extname(dirPath));
			var gulpfile = requireModify(findupSync('gulpfile.js'), function (src) {
				return src + ';module.exports = require(\'gulp\')';
			});

			var tasks = _.pull(Object.keys(gulpfile.tasks), 'default');
			tasks.unshift('default');

			updateTrayMenu(name, tasks);
		} catch (err) {
			updateTrayMenu('No gulpfile found');
			console.log(err);
		}
	});
}

var tray = new gui.Tray({
	icon: 'menubar-icon@2x.png',
	alticon: 'menubar-icon-alt@2x.png'
});

updateTray();

if (DEBUG) {
	gui.Window.get().showDevTools();
}
