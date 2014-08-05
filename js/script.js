var width = 1300,
	height = 975,
	radius = 15;
	
var orange = d3.rgb(255, 161, 51),	
	lightGray = d3.rgb(245, 228, 198),	
	lightestGray = d3.rgb(255, 250, 230),	
    bg = d3.rgb(51, 51, 51);	
	
var padding = 5,
	columnPadding = 350;

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
	resetButton = d3.select("#reset");
		
var nodes = [],
    links = [],
    visibleNodes = [];

var selectedNode = 0;

var relationshipStatus = [];
var significanceFilter = 1;


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

d3.csv("http://www.sfu.ca/~ssumal/Inda/data/indaData.csv", function(csv, index) { 

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
    console.log(rows);

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
                        {type: "ParentOf", checked: true},
                        {type: "SpouseOrBetrothed", checked: true},
                        {type: "ChildOf", checked: true},
                        {type: "InLoveWith", checked: true},
                        {type: "Siblings", checked: true}, 
                        {type: "AcademyClassmates", checked: true},
                        {type: "AcademyTeacherFor", checked: true},
                        {type: "CousinsWith", checked: true},
                        {type: "RunnerFor", checked: true},
                        {type: "PimRyala", checked: true},
                        {type: "ServedBy", checked: true},
                        {type: "TaughtBy", checked: true},
                        {type: "KodlMarines", checked: true}];

    selectedNode = nodes[0];

    setUpInteractions();
    buildVisual();
	playTransition();

});


////////////////////////////////////////////////////////
//			EVENT HANDLERS & LISTENERS
////////////////////////////////////////////////////////

function setUpInteractions() {
	// Build dropdown menu dynamically
    var opts = '';
    for(var i in nodes) {
        opts += '<option value="' + i + '">' + (nodes[i].Name + " " + nodes[i].FamilyName) + '</option>';
    }
    dropdown.html(opts);
	
	// Event for dropdown changes
    dropdown.on('change',changeCenterPoint);
	
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
    significanceFilter = d3.event.target.value;
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
	
	console.log(visibleLinks);
	
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
				currentNode.x = (width-columnPadding)/2 + columnPadding - 50;
				currentNode.y = height/2;
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
		   
    nodeItems.append("circle")      
        .attr("r", radius);
		  
		  
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
                return "http://www.sfu.ca/~ssumal/Inda/css/images/" + link.type + ".png";
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
			d3.select(".node" + currentNode.Index + " text")
				.transition()
				.duration(150)
				.style("fill", lightGray);
			d3.select(".node" + currentNode.Index + " rect")
				.transition()
				.duration(150)
				.style("fill", bg)
				.style("opacity", opacity);
		})
		.on("mouseover", function(currentNode, currentIndex) {
			d3.select(".node" + currentNode.Index + " text")
				.transition()
				.duration(150)
				.style("fill", "black");
			d3.select(".node" + currentNode.Index + " rect")
				.transition()
				.duration(150)
				.style("fill", orange)
				.style("opacity", 0.9);
			
			moveToFront(d3.select(".node" + currentNode.Index));
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
		.style("font-size", "17px")
		.style("text-anchor", 'middle')
		.style("fill", lightestGray);
		
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
			.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
			.attr("cx", function(d) { 
				if(d.Index == selectedNode.Index) {
					d.x = (width-columnPadding)/2 + columnPadding - 50;
					d.y = height/2;
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

