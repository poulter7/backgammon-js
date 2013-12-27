
/**
 * Module dependencies.
 */

var express = require('express');
var exphbs  = require('express3-handlebars');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var lessMiddleware = require('less-middleware');
var io = require('./src/server.js')


var app = express();
// all environments
console.log('launching');
app.configure(function () {
	app.use(lessMiddleware({
		src: __dirname + '/public',
		compress: true
	}));

	app.use(express.static(__dirname + '/public'));
});

app.engine('html', exphbs({defaultLayout: 'main', extname: '.html'}));
app.set('view engine', 'html');

app.get('/', function (req, res) {
		res.render('index');
});


app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

io.start(app, 3000)


