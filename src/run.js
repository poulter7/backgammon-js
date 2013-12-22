var sys = require('sys')
var Board = require('../src/game.js')

console.log(Board)
var express = require('express');
var app = express();

app.get('/', function(req, res){
		res.send('hello world');
});

app.listen(3000);
