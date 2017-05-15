
var webpack	= require('webpack')
var env		= process.env.NODE_ENV.split('.')
	env		= {target: env[0], mode: env[1]}

var config = {
	entry   : {'./build/index.js' : './src/index.js'},
	devtool : 'source-map',
	module  : {
		loaders	: [
			// es6
			{
				test	: /\.(js)$/,
				loader	: 'babel-loader',
				query	: {presets: ["es2015"]},
				exclude	: /node_modules/
			},
			// sass
			{
				test    : /\.(sass)$/,
				loaders : ['style-loader', 'css-loader', 'sass-loader?sourceMap'],
				exclude	: /node_modules/
			},
			{
				test: /\.(ttf|svg)$/,
				loader: 'file-loader?name=./graphic/[name].[ext]'
			},
			{
				test: /\.(jpg|png|svg)$/,
				loader: 'url-loader'
			}
		]
	},
	/*resolve : {
		alias : {
			fw : '/Users/antonkluev/Desktop/Dev/web/libs/fw/src/'
		}
	}*/
};

var out = {
	output  : {
		filename      : '[name]',
		libraryTarget : 'umd',
		library       : 'index'
	}
};

// browser dev
if (env.target == 'client') Object.assign(config, {
	output    : {filename : '[name]'},
	devServer : {
		contentBase : './',
		stats       : 'errors-only',
		inline      : true,
		hot         : true,
		port        : 8000
	},
	plugins : [
		new webpack.HotModuleReplacementPlugin()
	]
});

// server dev
else if (env.target == 'server') Object.assign(config, out, {
	watch : true
});

// build
else if (env.target == 'build') Object.assign(config, out, {
	plugins : [
		new webpack.optimize.UglifyJsPlugin({
			output: {comments: false},
			sourceMap: true
		})
	]
});

module.exports = config;
