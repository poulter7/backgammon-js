radius = 22;
buffer = 2;
margin = 25
var socketURL = 'http://' + window.location.host;
var options ={
	transports: ['websocket'],
	'force new connection': true
};

window.onload = function(){
	client = io.connect(socketURL, options);
	client.on("connect", function(data){
		client.emit("status");
		client.emit("dice");
	});
	client.on("status", function(board){
		render_board(board)
	});
	client.on("dice", function(dice){
		render_dice(dice)
	});
}

px = {
	1: 625,
	2: 575,
	3: 525,
	4: 475,
	5: 425,
	6: 375,
	7: 275,
	8: 225,
	9: 175,
	10: 125,
	11: 75,
	12: 25,
	24: 625,
	23: 575,
	22: 525,
	21: 475,
	20: 425,
	19: 375,
	18: 275,
	17: 225,
	16: 175,
	15: 125,
	14: 75,
	13: 25,
	home: 685,
	bar: 325
}

cx = function(p){
	return px[p.position];
}
cy = function(p){
	positionIndent = (2*radius + buffer)*(p.index % 5) + Math.floor(p.index/ 5) * 4 * buffer;
	if (_.isNumber(p.position)){
		if (p.position <= 12){ // bottom row
			return 500 - positionIndent - margin
		} else { 
			return positionIndent + margin
		}
	} else if (p.position=='home') {
		if(p.color == 'red'){
			return positionIndent + margin
		} else {
			return 500 - positionIndent - margin
		}
	} else {	// bar
		var middle = 250
		if(p.color == 'red'){
			return middle + buffer + radius + positionIndent
		} else {
			return middle - buffer - radius - positionIndent 
		}
	}
	return 0
}

selected = undefined;

var drag = d3.behavior.drag();

drag.on("drag", function() {
	d3.select(this).attr("cx", +d3.select(this).attr("cx") + d3.event.dx);
	d3.select(this).attr("cy", +d3.select(this).attr("cy") + d3.event.dy);
})

deselect = function() {
	d3.select(".selected").classed("selected", false);
	selected = undefined;
}

selectDice = function(die){
	client.emit('move', selected.position, parseInt(die.__data__))
}

selectPiece = function(circle){
	var sel = d3.select(circle);
	var clicked = sel.datum();

	if (clicked.selectable){
		deselect();
		sel.classed("selected", true);

		selected = clicked;
	}
}

render_dice = function(dice){
	console.log('Render dice')
	pieces = d3.select("#dice")
		.selectAll("a")
		.data(dice)
		.enter()
		.append("a")
		.on('click', function(d){console.log('Dice', this.__data__); selectDice(this)})
		.text(_.identity)
}

render_board = function(data){
	deselect();
	console.log('Rendering Board');

	// position -> count map
	var perPositionCount = _.countBy(data, _.values);
	// position -> piece map
	var perPositionPiece = _.indexBy(data, _.values);

	// f(count, piece) -> [pieces with index...]
	var indexedPieceFunction = function (countAndPiece) { 
		return _.times(
				countAndPiece[0],
				function(index) {
					return _.extend({index:index, selectable: index === countAndPiece[0] -1}, countAndPiece[1]);
				}
		)
	}
	var indexedPieces = _.map(_.zip(_.values(perPositionCount), _.values(perPositionPiece)), indexedPieceFunction )
	var indexedPieces = _.flatten(indexedPieces)

	d3.select("#pieces")
		.selectAll("circle")
		.data(indexedPieces)
		.enter()
		.append("circle")
		
	d3.select("#pieces")
		.selectAll("circle")
		.data(indexedPieces)
		.attr("r", radius)
		.attr("cx", cx)
		.attr("cy", cy)
		.attr("index", function(d){ return d.index})
		.attr("pos", function(d){ return d.position})
		.classed("red", function(d){ return d.color === "red"})
		.classed("black", function(d){ return d.color === "black"})
		.on('click', function(){selectPiece(this)})


}
