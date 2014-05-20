'use strict';
var path = require('path');
var spawn = require('child_process').spawn;
var gui = require('nw.gui');
var findupSync = require('findup-sync');
var currentPath = require('current-path');
var displayNotification = require('display-notification');
var util = require('./node-util');
var getGulpTasks = require('./get-gulp-tasks');

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
	var gulpPath = path.join(util.dirname, 'node_modules', 'gulp', 'bin', 'gulp.js');
	var args = [taskName, '--no-color'];
	if ('yes' == localStorage.getItem('config_coffee')){
		args = args.concat('--require','coffee-script/register');
	}
	var cp = spawn(gulpPath, args);

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

	// Options and submenus
	menu.append(new gui.MenuItem({type: 'separator'}));
	var item_options = new gui.MenuItem({
		label: 'Options'
	})
	var submenu = new gui.Menu();
	submenu.append(new gui.MenuItem({
		type:'checkbox',
		label: 'gulpfile.js',
		checked: true,
		enabled: false
	}));
	var item_coffee = new gui.MenuItem({
		type:'checkbox',
		label: 'gulpfile.coffee',
		checked: ('yes' == localStorage.getItem('config_coffee')),
		click: function () {
			var flag = ('yes' == localStorage.getItem('config_coffee'));
			localStorage.setItem('config_coffee', flag ? 'no' : 'yes')
			item_coffee.checked = !flag;
		}
	});
	submenu.append(item_coffee);
	item_options.submenu = submenu;
	menu.append(item_options);

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
		var options = {
			config_coffee: localStorage.getItem('config_coffee')
		};
		getGulpTasks(options, function (err, tasks) {
			if (err) {
				console.log(err);
				return;
			}

			updateTrayMenu(name, tasks);
		});
	});
}

// Default options
if (!localStorage.getItem('config_coffee')){
	localStorage.setItem('config_coffee', 'no');
}

var tray = new gui.Tray({
	icon: 'menubar-icon@2x.png',
	alticon: 'menubar-icon-alt@2x.png'
});

updateTrayMenu('No gulpfile found');
updateTray();

if (DEBUG) {
	gui.Window.get().showDevTools();
}
