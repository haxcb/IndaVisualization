var width = 1300,
	height = 975,
	radius = 15;
	
var orange = d3.rgb(255, 161, 51),
	gray = d3.rgb(153, 153, 153),
	hoverColor = d3.rgb(255, 210, 179),	
	lightGray = d3.rgb(245, 228, 198),	
	lightestGray = d3.rgb(255, 250, 230),	
    bg = d3.rgb(51, 51, 51);	
	
var padding = 5,
	columnPadding = 350,
	MID_Y = height/2,
	MID_X = (width-columnPadding)/2 + columnPadding - 50;

var force = d3.layout.force()
	.gravity(0.05)
    .charge(-2000)
    .linkDistance(150)
    .size([width, height]);

var svg = d3.select(".svgContainer")
	.append("svg")
	.attr("width", width)
	.attr("height", height);
	
var slider = d3.select("#slider"),
	dropdown = d3.select("select"),
	resetButton = d3.select("#reset"),
	dropdownLabel = d3.select(".significanceLabel");
		
var nodes = [],
    links = [],
    visibleNodes = [];

var selectedNode = 0;

var relationshipStatus = [];
var significanceFilter = 1;
var significanceLabels = [
		"Only show the most significant characters",
		"Only show significant characters",
		"Include moderately significant characters",
		"Include insignificant characters",
		"Show all characters"
	];


////////////////////////////////////////////////////////
//				PARSE DATA
////////////////////////////////////////////////////////

function createLinks(relationshipType, people, sourceIndex) {
    if(people && people.length > 0) {
        for(var p in people) {
            var targetIndex = -1;
            for(var j in nodes) {
                
                if(people[p] == (nodes[j].Name + " " + nodes[j].FamilyName + " (" + nodes[j].AKA + ")") )  {
                    targetIndex = nodes[j].Index;
                    break;
                }
                else if (people[p] == (nodes[j].Name + " " + nodes[j].FamilyName)) {
                    targetIndex = nodes[j].Index;
                    break;
                }
                else if (people[p] == nodes[j].Name) {
                    targetIndex = nodes[j].Index;
                    break;
                }
                else if (people[p] == nodes[j].Name + " ("  + nodes[j].AKA + ")") {
                    targetIndex = nodes[j].Index;
                    break;
                }
            }
            if (targetIndex != -1) {
                links.push({ "type": relationshipType, 
                         "target": +targetIndex, 
                         "source": +sourceIndex });
            }
        };
    } 
}

d3.csv("http://www.sfu.ca/~harshad/files/IAT355/Final/data/indaData.csv", function(csv, index) { 

    nodes.push({"Index": index,
                "Name": csv.Name,
                "AKA": csv.AKA,
                "FamilyName": csv.FamilyName,
                "Importance": +csv.Importance,
                "Gender": csv.Gender });

    return {
        "Index": index,
    	"Name": csv.Name,
      	"AKA": csv.AKA,
        "FamilyName": csv.FamilyName,
        "Importance": +csv.Importance,
        "Gender": csv.Gender,
        "ParentOf": csvToArr(csv.ParentOf),
        "SpouseOrBetrothed": csvToArr(csv.SpouseOrBetrothed),
        "InLoveWith": csvToArr(csv.InLoveWith),
        "ChildOf": csvToArr(csv.ChildOf),
        "Siblings": csvToArr(csv.Siblings),
        "AcademyClassmates": csvToArr(csv.AcademyClassmates),
        "CousinsWith": csvToArr(csv.CousinsWith),
        "RunnerFor": csvToArr(csv.RunnerFor),
        "PimRyala":  csvToArr(csv.PimRyala),
        "KodlMarines": csvToArr(csv.KodlMarines),
        "ServedBy": csvToArr(csv.ServedBy),
        "TaughtBy": csvToArr(csv.TaughtBy),
        "AcademyTeacherFor": csvToArr(csv.AcademyTeacherFor),
    };
	
}, function(error, rows){

    for(var i in rows) {
        createLinks("ParentOf", rows[i].ParentOf,i);
        createLinks("SpouseOrBetrothed", rows[i].SpouseOrBetrothed,i);
        createLinks("InLoveWith", rows[i].InLoveWith,i);
        createLinks("ChildOf", rows[i].ChildOf,i);
        createLinks("Siblings", rows[i].Siblings,i);
        createLinks("AcademyClassmates", rows[i].AcademyClassmates,i);
        createLinks("AcademyTeacherFor", rows[i].AcademyTeacherFor,i);
        createLinks("CousinsWith", rows[i].CousinsWith,i);
        createLinks("RunnerFor", rows[i].RunnerFor,i);
        createLinks("PimRyala", rows[i].PimRyala,i);
        createLinks("ServedBy", rows[i].ServedBy,i);
        createLinks("KodlMarines", rows[i].KodlMarines,i);
        createLinks("TaughtBy", rows[i].TaughtBy,i);
    }

    relationshipStatus = [  
						// Yellows
                        {type: "SpouseOrBetrothed", checked: true, color: d3.rgb(182, 11, 0)},
                        {type: "InLoveWith", checked: true, color: d3.rgb(176, 0, 38)},
                        {type: "ParentOf", checked: true, color: d3.rgb(222, 14, 45)},
                        {type: "Siblings", checked: true, color: d3.rgb(203, 52, 56)},
						
						// Reds
                        {type: "ChildOf", checked: true, color: d3.rgb(255, 76, 51)}, 
                        {type: "CousinsWith", checked: true, color: d3.rgb(217, 46, 22)},
                        {type: "AcademyClassmates", checked: true, color: d3.rgb(219, 72, 7)},
                        {type: "AcademyTeacherFor", checked: true, color: d3.rgb(240, 88, 0)},					
                        {type: "TaughtBy", checked: true, color: d3.rgb(217, 107, 22)},
						{type: "RunnerFor", checked: true, color: d3.rgb(239, 128, 0)},
						
						// Oranges
                        {type: "ServedBy", checked: true, color: d3.rgb(255, 140, 51)},
                        {type: "PimRyala", checked: true, color: d3.rgb(215, 160, 0)},						
                        {type: "KodlMarines", checked: true, color: d3.rgb(255, 185, 47)}];
						
    setUpInteractions();
    buildVisual();
	playTransition();

});


////////////////////////////////////////////////////////
//			EVENT HANDLERS & LISTENERS
////////////////////////////////////////////////////////

function setUpInteractions() {
	
	var alphaNodes = [];
	for(var i in nodes) {
		alphaNodes.push(nodes[i]);
	}
	
	alphaNodes.sort(function(a, b) {
		return d3.ascending(a.Name, b.Name);
	});

	// Build dropdown menu dynamically
    var opts = '';
    for(var i in alphaNodes) {
        opts += '<option value="' + alphaNodes[i].Index + '">' + (alphaNodes[i].Name + " " + alphaNodes[i].FamilyName) + '</option>';
    }
    dropdown.html(opts);
	
	selectedNode = nodes[0];
	dropdown.property('value', 0);
	
	// Event for dropdown changes
    dropdown.on('change',changeCenterPoint);
	
	dropdownLabel.html(significanceLabels[4]);
	
	// Event for relationship filter changes
    d3.selectAll('.relationFilters input').on('change',getRelationships);
	
	// Event for char significance slider changes
    slider.on('change', changeCharacterSignificance);
	
	// Event for resetting filter button
	resetButton.on("click", resetNodeFilters);
}

function getRelationships() {
    var checkedStatus = d3.select(this).node().checked;
    var relationType = d3.select(this).node().id;
    for(var i in relationshipStatus) {
        if(relationType == relationshipStatus[i].type) {
            relationshipStatus[i].checked = Boolean(checkedStatus);
        }
    }
    buildVisual();
}

function changeCharacterSignificance() {
    significanceFilter = parseInt(d3.event.target.value);
	var s = significanceLabels[parseInt(5 - significanceFilter)];
	dropdownLabel.html(s);
    buildVisual();
}

function changeCenterPoint() {
    selectedNode = nodes[d3.event.target.value];
    resetNodeFilters();
}

function resetNodeFilters() {
	resetFilters();
    buildVisual();
	playTransition() 
}

////////////////////////////////////////////////////////
//				DRAW CODE
////////////////////////////////////////////////////////

var relevantNodes = [];

function buildVisual() {
    visibleNodes = [];
    relevantNodes = [];
	visibleLinks = [];
	
	for(var i in links) {
		var currentLink = links[i];
		if(!isNaN(links[i].source)) {
			links[i].source = getNode(links[i].source);
			links[i].target = getNode(links[i].target);
		}
		for(var i in relationshipStatus) {
			if(selectedNode.Index == currentLink.source.Index) {
				var target = currentLink.target;
				relevantNodes.push(target);
				
				if(currentLink.type == relationshipStatus[i].type && relationshipStatus[i].checked && target.Importance >= significanceFilter) {
					visibleNodes.push(target);
					visibleLinks.push(currentLink);					
					break;
				}
			}
		}
	}
	
    svg.html("");
	
    force
        .nodes(nodes)
        .links(visibleLinks)
        .start();

    var linkItems = svg.selectAll(".link")
        .data(visibleLinks)
        .enter().append("line")
        .attr("class", "link")
        .style("stroke-width", function(d) { return Math.sqrt(d.value); });
	
    var nodeItems = svg.selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("r", radius)
		.attr("class", function(currentNode, currentIndex) { return "node node" + currentIndex; })
		.filter(function(currentNode, currentIndex) {
			if(currentNode.Index == selectedNode.Index) {
				currentNode.x = MID_X;
				currentNode.y = MID_Y;
				return true;
			}
			for(var i in visibleNodes) {
				if(currentNode.Index == visibleNodes[i].Index || selectedNode.Index == currentNode.Index) {
					return true;
				} 
			}
			return false;
		})
        .on("click", function (currentNode, currentIndex) {
			if(currentNode.Index != selectedNode.Index) {
				selectedNode = currentNode;
				resetFilters();
				buildVisual();
				playTransition();
			}
        });        
	
	// Assign custom colors to every node
    nodeItems.append("circle")      
        .attr("r", radius)
		.attr("fill", function(currentNode, currentIndex) {
			var link = getLink(currentNode);
			if(link != null) {
				for(var i in relationshipStatus) {
					if(relationshipStatus[i].type == link.type) {
						return relationshipStatus[i].color;
					}
				}
			}
			return orange;
		});
		  
		  
	var linkedNodes = nodeItems.filter(function(currentNode, currentIndex) {
		for(var i in visibleNodes) {
			if(visibleNodes[i].Index == currentNode.Index) {
				return true;
			}
		}
		return false;
	});
	
	nodeItems.append("text")
        .attr("dx", 25)
        .attr("dy", ".35em")
        .style("fill", lightGray)
        .text(function(d) {
            if(d.AKA != "") {
                return (d.Name + " " + d.FamilyName + " (" + d.AKA + ")");
            }
            return (d.Name + " " + d.FamilyName);
        });	
		
		
	// Add rectangles behind text labels
	var el = document.getElementsByTagName('text'); 
	nodeItems.append("rect")
		.attr("x", function(d, i) {return el[i].getBBox().x - padding})
		.attr("y", function(d, i) {return el[i].getBBox().y - padding})
		.attr("width", function(d, i) {return el[i].getBBox().width + padding *2})
		.attr("height", function(d, i) {return el[i].getBBox().height + padding*2})
		.style('opacity', 0.5)
		.attr("fill", bg);	
	
	// Reorder the rectangles to be behind text
	moveToFront(d3.selectAll("text"));
	
	// Add image icons to nodes
    nodeItems.append("image")
        .attr("xlink:href", function(currentNode,currentIndex) {
            var link = getLink(currentNode);
            if(link != null) {
                return "http://www.sfu.ca/~harshad/files/IAT355/Final/css/images/" + link.type + ".png";
            }
        })
        .attr("x", -15)
        .attr("y", -15)
        .attr("height", 31)
        .attr("width", 31);
		
	// Hover animation	
	nodeItems
		.on("mouseout", function(currentNode, currentIndex) {
			var opacity = 0.5;
			if(currentNode.Index == selectedNode.Index) {
				opacity = 1;
			}
			// Change text color back
			d3.select(".node" + currentNode.Index + " text")
				.transition()
				.duration(150)
				.style("fill", lightGray);
			// Change bg rect color back
			d3.select(".node" + currentNode.Index + " rect")
				.transition()
				.duration(150)
				.style("fill", bg)
				.style("opacity", opacity);
		})
		.on("mouseover", function(currentNode, currentIndex) {
			// Change text color for hover
			d3.select(".node" + currentNode.Index + " text")
				.transition()
				.duration(150)
				.style("fill", "black");
			// Change bg rect color for hover
			d3.select(".node" + currentNode.Index + " rect")
				.transition()
				.duration(150)
				.style("fill", orange)
				.style("opacity", 0.9);
			
			moveToFront(d3.select(".node" + currentNode.Index));
		});	
	
	// Change the colors of the relationship filters on the sidebar
	d3.selectAll('.relationFilters input[type="checkbox"] + img')
		.style("background-color", function() {
			var relation = d3.select(this).attr("src");
			for(var i in relationshipStatus) {
				if(relation.indexOf(relationshipStatus[i].type) > -1 && relationshipStatus[i].checked) {
					return relationshipStatus[i].color;
				}
			}
			return gray;
		})
		.on('mouseover', function() {
			// Change color on hover
			var checkedStatus = d3.select(this).node().checked;
			d3.select(this)
				.transition()
				.duration(150)
				.style("background-color", hoverColor);
		
		})
		.on('mouseout', function() {
			// Change color back on mouseout
			var relation = d3.select(this).attr("src");
			for(var i in relationshipStatus) {
				if(relation.indexOf(relationshipStatus[i].type) > -1 && relationshipStatus[i].checked) {
					d3.select(this)
						.transition()
						.duration(150)
						.style("background-color", relationshipStatus[i].color);
					return;
				}
			}
			d3.select(this)
				.transition()
				.duration(150)
				.style("background-color", gray);
			
		});
	
	// Style the central node
	var centralElement = document.getElementsByClassName("node"+selectedNode.Index)[0];
	var centralNode = nodeItems.filter(function(currentNode, currentIndex) {
		return currentNode.Index == selectedNode.Index;
	});

	centralNode.selectAll("circle")
		.attr("class", "central")
		.attr("fill", bg)
		.attr("stroke", orange)
		.attr("stroke-width", 5)
		.attr("r", radius*1.5);
		
	centralNode.selectAll("image").remove();
		
	centralNode.selectAll("text")
		.attr("dx", 0)
		.style("font-size", "18px")
		.style("font-weight", "100")
		.style("text-anchor", 'middle')
		.style("fill", "white");
		
	centralNode.selectAll("rect")
		.attr("x", centralElement.getBBox().x - padding*2)
		.style("opacity", 1)
		.attr("width", function(currentNode, currentIndex) { return centralElement.getBBox().width + padding*2; });
	
	moveToFront(centralNode);
	
	centralNode.call(force.drag);
	linkedNodes.call(force.drag);
	

    force.on("tick", function(e) {
        linkItems
			.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });
		
   
        nodeItems
			.attr("transform", function(d) { 
				var transform = "translate(" + d.x + "," + d.y + ")";
				
				// var scaleFactor = parseFloat(0.7 + (d.Importance / 5));
				// if(d.Index == selectedNode.Index)
					// scaleFactor = 1;
				
				// transform += "scale(" + scaleFactor + ")";
				return transform; 
			})
			.attr("cx", function(d) { 
				if(d.Index == selectedNode.Index) {
					d.x = MID_X;
					d.y = MID_Y;
				}
				return d.x = Math.max(columnPadding + radius*2, Math.min(width - radius*2, d.x)); 
			})
			.attr("cy", function(d) { 
				return d.y = Math.max(radius*2, Math.min(height - radius*2, d.y)); 
			});
			

    });
}

////////////////////////////////////////////////////////
//				HELPER METHODS
////////////////////////////////////////////////////////

function csvToArr(csvData) {
	return d3.csv.parseRows(csvData.replace(/\s*;\s*/g, ","))[0];
}

function resetFilters() {
    for(var i in relationshipStatus) {
        relationshipStatus[i].checked = true;
        d3.selectAll('.relationFilters input').property('checked', 'true');
    } 
    significanceFilter = 1;
    slider.property('value', 1);
    dropdown.property('value', selectedNode.Index);
}

// Get the link of the given node
function getLink(currentNode) {
    for(var i in links) {
        if(links[i].source.Index == selectedNode.Index && links[i].target.Index == currentNode.Index) {
            return links[i];
        }
    }
    return null;
}

// Get the link of the given node
function getNode(index) {
    for(var i in nodes) {
        if(nodes[i].Index == index) {
			return nodes[i];
		}
    }
    return null;
}

// Move the given element in front of its sibling elements
function moveToFront(element) {
	element
		.each(function() {
			this.parentNode.appendChild(this);
		});
}
    
function playTransition() {
	d3.selectAll(".node")
		.style("opacity", 0.0)
			.transition()
			.duration(500)
			.style("opacity", 1.0);
}

