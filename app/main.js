'use strict';
var path = require('path');
var spawn = require('child_process').spawn;
var findupSync = require('findup-sync');
var currentPath = require('current-path');
var displayNotification = require('display-notification');
var getGulpTasks = require('./get-gulp-tasks');


var app = require('app');
var Tray = require('tray');
var Menu = require('menu');
var MenuItem = require('menu-item');

var tray = null;
var DEBUG = true;
var TRAY_UPDATE_INTERVAL = 1000;

// fix the $PATH on OS X
// OS X doesn't read .bashrc/.zshrc for GUI apps
if (process.platform === 'darwin') {
	process.env.PATH += ':/usr/local/bin';
	process.env.PATH += ':' + process.env.HOME + '/.nodebrew/current/bin';
}

function runTask(taskName) {
	// TODO: find workaround for node-webkit bug:
	// https://github.com/rogerwang/node-webkit/issues/213
	// so I don't have to hardcode the node path
	var gulpPath = path.join(__dirname, 'node_modules', 'gulp', 'bin', 'gulp.js');
	var cp = spawn('node', [gulpPath, taskName, '--no-color']);

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
			console.error('Exited with error code ' + code);

			displayNotification({
				title: 'gulp',
				subtitle: 'Exited with error code ' + code,
				sound: 'Basso'
			});
		}
	});
}

function createTrayMenu(name, tasks, status) {
	var menu = new Menu();

	menu.append(new MenuItem({
		label: name,
		enabled: false
	}));

	if (status) {
		menu.append(new MenuItem({type: 'separator'}));
		menu.append(new MenuItem({
			label: status,
			enabled: false
		}));
	}

	if (tasks && tasks.length > 0) {
		menu.append(new MenuItem({type: 'separator'}));

		tasks.forEach(function (el) {
			menu.append(new MenuItem({
				label: el,
				click: function () {
					runTask(el);
				}
			}));
		});
	}

	menu.append(new MenuItem({type: 'separator'}));
	menu.append(new MenuItem({
		label: 'Quit',
		click: app.quit
	}));

	tray.setContextMenu(menu);

	return menu;
}

var foundForPath = null;

function updateTrayMenu() {
	createTrayMenu.apply(null, arguments);
}

function updateTray() {
	currentPath(function (err, dirPath) {
		setTimeout(updateTray, TRAY_UPDATE_INTERVAL);

		process.chdir(dirPath);

		var pkg;
		var pkgPath = findupSync('package.json');

		if (pkgPath) {
			pkg = require(pkgPath);
		} else {
			console.log('Couldn\'t find package.json.');
			return;
		}

		var name = pkg.name || path.basename(dirPath, path.extname(dirPath));

		getGulpTasks(function (err, tasks) {
			if (err) {
				console.log(err);
				return;
			}
			// Only update the TrayMenu if the path changed
			if (foundForPath !== dirPath) {
				foundForPath = dirPath;
				updateTrayMenu(name, tasks);
			}
		});
	});
}

app.on('ready', function(){
	tray = new Tray('./menubar-icon.png');
	tray.setPressedImage('./menubar-icon-alt.png');

	updateTrayMenu('No gulpfile found');
	updateTray();

	if (DEBUG) {
		//gui.Window.get().showDevTools();
	}
});

