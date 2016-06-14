'use strict';
const path = require('path');
const spawn = require('child_process').spawn;
const findupSync = require('findup-sync');
const currentPath = require('current-path');
const displayNotification = require('display-notification');
const getGulpTasks = require('get-gulp-tasks');
const _ = require('lodash');
const fixPath = require('fix-path');

const app = require('app');
const dialog = require('dialog');
const Tray = require('tray');
const Menu = require('menu');
const MenuItem = require('menu-item');

const DEBUG = true;
const TRAY_UPDATE_INTERVAL = 1000;

let tray;
let prevPath;
let recentProjects = [];
let currentProject = {
	name: 'No gulpfile found',
	tasks: []
};

require('crash-reporter').start();

app.dock.hide();

// fix the $PATH on macOS
fixPath();

function runTask(taskName) {
	const gulpPath = path.join(__dirname, 'node_modules', 'gulp', 'bin', 'gulp.js');
	const cp = spawn(gulpPath, [taskName, '--no-color']);

	cp.stdout.setEncoding('utf8');
	cp.stdout.on('data', data => {
		console.log(data);
	});

	// TODO: show progress in menubar menu
	// tray.menu = createTrayMenu(name, [], 'progress here');

	cp.stderr.setEncoding('utf8');

	cp.stderr.on('data', data => {
		console.error(data);
		displayNotification({text: `[error] ${data}`});
	});

	cp.on('exit', code => {
		if (code === 0) {
			displayNotification({
				title: 'gulp',
				subtitle: 'Finished running tasks'
			});
		} else {
			console.error(`Exited with error code ${code}`);

			displayNotification({
				title: 'gulp',
				subtitle: `Exited with error code ${code}`,
				sound: 'Basso'
			});
		}
	});
}

function addRecentProject(project) {
	recentProjects = recentProjects.filter(x => x.name !== project.name);

	if (recentProjects.length === 10) {
		recentProjects.pop();
	}

	recentProjects.unshift(project);
}

function createProjectMenu() {
	const menu = new Menu();

	if (process.platform === 'darwin' || process.platform === 'win32') {
		menu.append(new MenuItem({
			label: 'Follow Finder'
		}));

		menu.append(new MenuItem({type: 'separator'}));
	}

	if (recentProjects.length > 0) {
		recentProjects.forEach(el => {
			menu.append(new MenuItem({
				label: el.name,
				type: 'radio',
				checked: el.name === currentProject.name
			}));
		});

		menu.append(new MenuItem({type: 'separator'}));
	}

	menu.append(new MenuItem({
		label: 'Open Project',
		click() {
			dialog.showOpenDialog(null, {
				title: 'Pick a project',
				properties: ['openDirectory'],
				defaultPath: path.resolve(process.cwd(), '..')
			}, dirs => {
				setActiveProject(dirs[0]);
				addRecentProject(currentProject);
				createTrayMenu();
			});
		}
	}));

	menu.append(new MenuItem({type: 'separator'}));

	menu.append(new MenuItem({
		label: 'Clear',
		click() {
			recentProjects.length = 0;
			createTrayMenu();
		}
	}));

	return menu;
}

function createTrayMenu() {
	const menu = new Menu();

	menu.append(new MenuItem({
		label: currentProject.name,
		submenu: createProjectMenu()
	}));

	if (currentProject.tasks && currentProject.tasks.length > 0) {
		menu.append(new MenuItem({type: 'separator'}));

		currentProject.tasks.forEach(el => {
			menu.append(new MenuItem({
				label: el,
				click() {
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

function setActiveProject(dirPath) {
	currentProject = {};
	process.chdir(dirPath);

	const pkgPath = findupSync('package.json');

	if (!pkgPath) {
		console.log('Couldn\'t find package.json');
		return;
	}

	const pkg = require(pkgPath);

	currentProject.path = dirPath;
	currentProject.name = pkg.name || path.basename(dirPath, path.extname(dirPath));

	getGulpTasks((err, tasks) => {
		if (err) {
			if (err.code !== 'MODULE_NOT_FOUND') {
				console.error(err);
			}

			return;
		}

		tasks = _.pull(tasks, 'default');
		tasks.unshift('default');

		currentProject.tasks = tasks;

		console.log(prevPath, dirPath);

		// TODO: this prevent updating of tasklist from changes in the gulpfile
		if (prevPath !== dirPath) {
			prevPath = dirPath;
			createTrayMenu();
		}
	});
}

function updateTray() {
	currentPath((_, dirPath) => {
		setTimeout(updateTray, TRAY_UPDATE_INTERVAL);
		setActiveProject(dirPath);
	});
}

app.on('ready', () => {
	tray = new Tray(path.join(__dirname, 'menubar-icon.png'));
	tray.setPressedImage(path.join(__dirname, 'menubar-icon-alt.png'));

	createTrayMenu();
	updateTray();

	if (DEBUG) {
		// gui.Window.get().showDevTools();
	}
});
