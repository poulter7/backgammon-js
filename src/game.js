var assert = require('assert')
var _ = require('underscore')

_.any = function(ls){
	return _.contains(ls, true);
}

function Board(redState, blackState, bar, home) {
	var bs = typeof blackState !== 'undefined' ? blackState : {};
	var rs = typeof redState !== 'undefined' ? redState : {};
	blankState = _.object(
		_.range(1, 25), 
		_.times(24,function(){return 0} )
	)
	this.blackState = _.extend({}, blankState, bs)
	this.redState = _.extend({}, blankState, rs)
	this.bar = typeof bar !== 'undefined' ? bar : {
		black: 0,
		red: 0
	};
	this.home = typeof home !== 'undefined' ? home : {
		black: 0,
		red: 0
	};
}

String.prototype.opponent = function(){
	if (this == 'red'){
		return 'black'
	} else if (this == 'black'){
		return 'red'
	}
}

function Player(color, board) {
	this.color = color;
	this.board = board;
}

Player.prototype = {
	get ownedPositions(){
		var t = this;
		var positions = _.filter(
			_.map(
				_.keys(this.state), 
				function(i){return parseInt(i)}
			),
			function(d){
				return t.piecesAt(d) > 0;
			}
		);
	    var barPositions = this.bar > 0 ? ['bar'] : [];
		return positions.concat(barPositions);
	},
	get state() {
		if (this.color == 'red'){
			return this.board.redState;
		} else {
			return this.board.blackState;
		}
	},
	get opponent(){
		return this.board[this.color.opponent()];
	},
	get bar(){
		return this.board.bar[this.color];
	},
	set bar(val){
		this.board.bar[this.color] = val;
	},
	get home(){
		return this.board.home[this.color];
	},
	set home(val){
		this.board.home[this.color] = val;
	},
	canMovePieceAt: function(pos){
		if (pos == 'bar'){
			return true;
		} else if (pos == 'home') {
			return false;
		} else {
			if (this.bar > 0){
				return false;
			} else {
				return this.bar == 0;
			}
		}
	},
	canMoveWith: function(roll){
		var that = this
		return _.any(_.map(
			this.ownedPositions, 
			function(d){return that.validMove(d, roll)}
		))
	},
	canMoveToTarget: function(target){
		return this.opponent.piecesAt(target) < 2;
	},
	canBearOff: function(pos, roll){
		var nonHomeIndices = this.color == 'red'? _.range(1, 19) : _.range(7, 25);
		var nonHomeValues = _.values(_.pick(this.state, nonHomeIndices));
		var nonHomeCount = _.reduce(nonHomeValues, function(x, y){return x + y}, 0);
		var homeIndices = this.color == 'red'? _.range(19, 25) : _.range(1, 7);
		var homeSubBoard = _.pick(this.state, homeIndices);

		var homeValues = [];

		for (var key in homeSubBoard){
			var o = homeSubBoard[key];
			if (o){
				homeValues.push(key);
			}

		}
		f = this.color == 'red' ? _.min : _.max;
		furthestPip = f(homeValues);
		requiredRollToHome = this.color == 'red' ? 25 - pos : pos

		return nonHomeCount == 0 && this.bar == 0 && (furthestPip == pos || requiredRollToHome == roll);
			
	},
	placePiece: function(target, roll){
		if (this.board.wouldBearOff(target)){
			// bearing off
			this.home += 1;
		} else {
			if (this.opponent.piecesAt(target) == 1){
				this.opponent.state[target] = 0;
				this.opponent.bar += 1;
			}
			this.state[target] = this.piecesAt(target) + 1;
		}
	},
	liftPiece: function(pos){
		if (pos === 'bar'){
			this.bar -= 1;
		} else {
			this.state[pos] -= 1; 
		}
	},
	piecesAt: function(pos){
		if (pos === 'bar'){
			return this.bar
		} else {
			if (typeof this.state[pos] === "undefined"){
				this.state[pos] = 0;
			} 
			return this.state[pos];
		}
	},
	validMove: function(pos, roll){
		var target = this.targetPosition(pos, roll);
		var canBearOff = this.canBearOff(pos, roll);
		var notBearingOff = !this.board.wouldBearOff(target)
		var validIfBearOff = notBearingOff || canBearOff;
		var canMoveTo = this.canMoveToTarget(target);
		var canMoveFrom = this.canMovePieceAt(pos);

		return (
			canMoveTo && 
			canMoveFrom &&
			validIfBearOff
		)
	},
	targetPosition: function(pos, roll){
		var p = pos;
		if (pos == 'bar'){
			p = this.color == 'red' ? 0: 25;
		}
		if (this.color == 'red'){
			return p + roll;
		} else if (this.color == 'black'){
			return p - roll;
		}
	},
	progressPiece: function(pos, roll){
		if (this.validMove(pos, roll)){
			var target = this.targetPosition(pos, roll);
			this.liftPiece(pos);
			this.placePiece(target, roll);
			return true;
		} else {
			return false;
		}
	}

}
	
Board.prototype = {
	get red(){
		return new Player('red', this);
	},
	get black(){
		return new Player('black', this);
	},
	toString: function(){
		return 'Red: ' + JSON.stringify(this.red.state) + '\nBlack: ' + JSON.stringify(this.black.state);
	},
	state: function(){
		var redBar = _(this.red.bar).times(function(){return {position: 'bar', color: 'red'}})
		var blackBar = _(this.black.bar).times(function(){return {position: 'bar', color: 'black'}})
		var redHome= _(this.red.home).times(function(){return {position: 'home', color: 'red'}})
		var blackHome = _(this.black.home).times(function(){return {position: 'home', color: 'black'}})

		var pieceGenerator = function(color, count, position){
			return _(count).times(
				function(){return {position:parseInt(position), color:color}}
			)
		}
		var redPieces = _.flatten(_.map(
			this.red.state, 
			_.partial(pieceGenerator, 'red')
		))

		var blackPieces = _.flatten(_.map(
			this.black.state, 
			_.partial(pieceGenerator, 'black')
		))

		return [].concat(redBar, blackBar, redHome, blackHome, redPieces, blackPieces)
	},
	owner: function(pos){
		if (this.red.piecesAt(pos) > 0){
			return this.red;
		} else if (this.black.piecesAt(pos) > 0){
			return this.black;
		}
	},
	wouldBearOff: function(target){
		return (target <= 0 || target > 24);
	},
}

var initialBoard = function() {
	return new Board(
		{1: 2, 12: 5, 17: 3, 19: 5,},
		{24: 2, 13: 5, 8: 3, 6: 5,}
	);
}

module.exports.Board = Board;
module.exports.initialBoard = initialBoard;
