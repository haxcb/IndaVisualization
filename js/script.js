var width = 800,
	height = 500,
	radius = 5;

var force = d3.layout.force()
	.charge(-500)
	.linkDistance(50)
	.size([width, height]);

var svg = d3.select(".container").append("svg")
	.attr("width", width)
	.attr("height", height);
		
var dataNodes = [],
	dataLinks = [];
	
