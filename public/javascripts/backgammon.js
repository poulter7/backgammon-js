window.onload = function(){
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
	var pieces = d3.select("#pieces");
	radius = 22;
	buffer = 2;
	margin = 25

	data = [
		{position: 'home', color: 'Red'},
		{position: 'home', color: 'Red'},
		{position: 'home', color: 'Black'},
		{position: 'bar', color: 'Black'},
		{position: 'bar', color: 'Black'},
		{position: 'bar', color: 'Red'},
		{position: 12, color: 'Red'},
		{position: 12, color: 'Red'},
		{position: 12, color: 'Red'},
		{position: 12, color: 'Red'},
		{position: 12, color: 'Red'},
		{position: 12, color: 'Red'},
		{position: 17, color: 'Red'},
		{position: 17, color: 'Red'},
		{position: 17, color: 'Red'},
		{position: 19, color: 'Red'},
		{position: 19, color: 'Red'},
		{position: 19, color: 'Red'},
		{position: 19, color: 'Red'},
		{position: 19, color: 'Red'},
		{position: 24, color: 'Black'},
		{position: 24, color: 'Black'},
		{position: 13, color: 'Black'},
		{position: 13, color: 'Black'},
		{position: 13, color: 'Black'},
		{position: 13, color: 'Black'},
		{position: 13, color: 'Black'},
		{position: 8, color: 'Black'},
		{position: 8, color: 'Black'},
		{position: 8, color: 'Black'},
		{position: 6, color: 'Black'},
		{position: 6, color: 'Black'},
		{position: 6, color: 'Black'},
		{position: 6, color: 'Black'},
		{position: 6, color: 'Black'},
	];

	// position -> count map
	perPositionCount = _.countBy(data, _.values);
	// position -> piece map
	perPositionPiece = _.indexBy(data, _.values);

	// f(count, piece) -> [pieces with index...]
	indexedPieceFunction = function (countAndPiece) { 
		return _.times(
				countAndPiece[0],
				function(index) {
					return _.extend({index:index}, countAndPiece[1]);
				}
		)
	}
	indexedPieces = _.map(_.zip(_.values(perPositionCount), _.values(perPositionPiece)), indexedPieceFunction )
	indexedPieces = _.flatten(indexedPieces)
	console.log(indexedPieces)

	pieces = d3.select("#pieces").selectAll("circle").data(indexedPieces);
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
			if(p.color == 'Red'){
				return positionIndent + margin
			} else {
				return 500 - positionIndent - margin
			}
		} else {	// bar
			var middle = 250
			if(p.color == 'Black'){
				return middle - buffer - radius - positionIndent 
			} else {
				return middle + buffer + radius + positionIndent
			}
		}

		return 0
	}
	pieces.enter()
		.append("circle")
		.attr("r", radius)
		.classed("red", function(d){ return d.color == "Red"})

	pieces
		.attr("cx", cx)
		.attr("cy", cy)


}
