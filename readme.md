# Node Guidance System

### How to `npm`

##### Initialization
- initialize a new project `npm init -y` and edit project info in `./package.json`
- install a module for a project `npm i <module> -S` where `-S` flag stands for entry in `./package.json` in a `"dependencies" : {}` section
- install a module for development `npm i <module> -D` where `-D` flag stands for entry in `./package.json` in a `"devDependencies" : {}` section
- to look for installed modules run `npm ls --depth 0`
- to uninstall a module `npm uninstall <module> [-S | -D]`

##### Git
- if you want to upload your project to the git, please remove `./node_modules` folder
- if you have downloaded the project, do initialization with `npm i` so all the modules will be downloaded and if necessary compiled

##### Scripts
- take a look into `./package.json` into a section `"scripts" : {}`
- to run script run `npm run <script>`
- to stop process press `Ctrl + C`

### How to `Webpack`

##### Brief overview
- the webpack configuration saved into `./webpack.js` or `./webpack.config.js`
- webpack transpiles `JavaScript ES6` with `babel` into `JavaScript ES5`
- the entry point of the transpilation is in `./src/index.js` and will be packed into the `./build/index.js`

##### Start
- to start the development server run `npm run server`
- if you are ready with changes, run `npm run build`

##### ES6 Modules
- to export an object from `./src/module.js`, use `export var num = 10;`
- to import an object into `./src/index.js`, use `import {num} from './module'`
- to import with custom name `import {num as NumberTen} from './module'`
- to import all modules from a file use `import * as Numbers from './module'`
- to export one single object use `export default ...`
- to import one single export use `import Obj from './module'`
- to include the whole file use `import './module'`
# eventGuidanceSystem_Node17
