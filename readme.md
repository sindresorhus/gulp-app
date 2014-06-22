# gulp-app

> [gulp](https://github.com/gulpjs/gulp) as an app

Easily run gulp tasks from the current directory in Finder and get notified when it's finished.

<img src="media/screenshot.png" width="315">

*OS X only for now, but will expand when further along.*


## Install

[Download](https://github.com/sindresorhus/gulp-app/releases) the app, unzip, and move it to the `Applications` folder.

*Devtools is opened with the app to make it easier to debug issues. Feel free to close it.*

Feedback wanted :)


## Launch on startup

Follow this [guide](https://github.com/sindresorhus/guides/blob/master/launch-app-on-startup-osx.md) if you would like the app to launch when you start your computer.


## Dev

##### Setup

- Download [atom-shell](https://github.com/atom/atom-shell/releases), rename `Atom.app` to `atom-shell.app` and put it in `/Applications`
- Add `alias atom-shell='/Applications/atom-shell.app/Contents/MacOS/atom'` to your .bashrc/.zshrc

##### Run

- `cd` into the `app` directory
- Run `npm install` *(only first time)*
- Run `atom-shell .`


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
