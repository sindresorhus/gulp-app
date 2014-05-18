# gulp-app

> [gulp](https://github.com/gulpjs/gulp) as an app

Easily run gulp tasks from the current directory in Finder and get notified when it's finished.

![](media/screenshot.png)

*OS X only for now, but will expand when further along.*


## Install

[Download](https://github.com/sindresorhus/gulp-app/releases) the app, unzip, and move it to the `Applications` folder.

*Make sure your node binary is in `/usr/local/bin` by running `$ which node`. It's [currently hard-coded](https://github.com/sindresorhus/gulp-app/blob/1b7fd477653f5b23b999a0e89667f9a281a41797/app/main.js#L19-L22) because of a node-webkit [bug](https://github.com/rogerwang/node-webkit/issues/213). Devtools is opened with the app to make it easier to debug issues. Feel free to close it.*

Feedback wanted :)


## Dev

##### Setup

- Download [node-webkit](https://github.com/rogerwang/node-webkit#downloads) and put it in `/Applications`
- Add `alias nw='/Applications/node-webkit.app/Contents/MacOS/node-webkit'` to your .bashrc/.zshrc

##### Run

- `cd` into the `app` directory
- Run `npm install` *(only first time)*
- Run `nw .`


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
