var width = 1000,
	height = 800,
	radius = 15;
	
var orange = d3.rgb(255, 161, 51);	

/**var force = d3.layout.force()
	.charge(-600)
	.linkDistance(260)
	.size([width, height]); **/

var force = d3.layout.force()
    .charge(-600)
    .linkDistance(260)
    .size([width, height]);

var svg = d3.select(".container").append("svg")
	.attr("width", width)
	.attr("height", height);
		
var nodes = [],
    links = [],
    visibleNodes = [];


var selectedNode = 0;

var relationshipStatus = [];
var significanceFilter = 1;


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

function csvToArr(csvData) {
	return d3.csv.parseRows(csvData.replace(/\s*;\s*/g, ","))[0];
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
                        {type: "KodlMarines", checked: true}];

    selectedNode = nodes[0];

    setUpInteractions();
    buildVisual();
});

function setUpInteractions() {
    var opts = '';
    for(var i in nodes) {
        opts += '<option value="' + i + '">' + (nodes[i].Name + " " + nodes[i].FamilyName) + '</option>';
    }
    d3.select('.centerPoint').html(opts);
    d3.select('.centerPoint').on('change',changeCenterPoint);
    d3.selectAll('.relationFilters input').on('change',getRelationships);
    d3.select('#slider').on('change',changeCharacterSignificance);
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
    resetFilters();
    buildVisual();
}

function resetFilters() {
    for(var i in relationshipStatus) {
        relationshipStatus[i].checked = true;
        d3.selectAll('.relationFilters input').property('checked', 'true');
    } 
    significanceFilter = 1;
    d3.select('#slider').property('value',1);
    d3.select('.centerPoint').property('value',selectedNode.Index);
}

function getLink(currentNode) {
    for(var i in links) {
        if(links[i].source.Index == selectedNode.Index && links[i].target.Index == currentNode.Index) {
            return links[i];
        }
    }
    return null;
}

function buildVisual() {
    visibleNodes = [];
    svg.html("");
    force
        .nodes(nodes)
        .links(links)
        .start();

    var linkItems = svg.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("class", "link")
        .filter(function(currentLink, currentIndex) {
            for(var i in relationshipStatus) {
                if(currentLink.type == relationshipStatus[i].type && relationshipStatus[i].checked) {
                    if(selectedNode.Index == currentLink.source.Index && currentLink.target.Importance >= significanceFilter) {
                        visibleNodes.push(currentLink.target);
                        return true;
                    }
                    else if(selectedNode.Index == currentLink.target.Index && currentLink.source.Importance >= significanceFilter) {
                        visibleNodes.push(currentLink.source);
                        return true;
                    }
                }
            }
            return false;
        })
        .style("stroke-width", function(d) { return Math.sqrt(d.value); });

    var nodeItems = svg.selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("r", radius)
        .filter(function(currentNode, currentIndex) {
            if(currentNode.Index == selectedNode.Index) {
                currentNode.x = width/2;
                currentNode.y = height/2;
            }
            for(var i in visibleNodes) {
                if(currentNode.Index == visibleNodes[i].Index || selectedNode.Index == currentNode.Index) {
                    return true;
                } 
            }
            return false;
        })
        .on("click", function (currentNode, currentIndex) {
            selectedNode = currentNode;
            resetFilters();
            buildVisual();
        })
        .call(force.drag);
        


    svg.selectAll(".node")
        .filter(function(currentNode, currentIndex) {
            for(var i in visibleNodes) {
                if(currentNode.Index == visibleNodes[i].Index || currentNode.Index == selectedNode.Index)
                {
                    return false;
                }
            }
            return true;
        }).remove();

    svg.selectAll(".link")
    .filter(function(currentLink, currentIndex) {
        if(currentLink.source.Index == selectedNode.Index) {
            for(var i in visibleNodes) {
                if(visibleNodes[i].Index == currentLink.target.Index) {
                    return false;
                }
            }
            return true;
        } 
        else if(currentLink.target.Index == selectedNode.Index) {
            for(var i in visibleNodes) {
                if(visibleNodes[i].Index == currentLink.source.Index) {
                    return false;
                }
            }
            return true;
        }
        return true;
    }).remove();
           
    nodeItems.append("circle")      
        .attr("r", radius);

    nodeItems.append("text")
        .attr("dx", 25)
        .attr("dy", ".35em")
        .style("fill", orange)
        .text(function(d) {
            if(d.AKA != "") {
                return (d.Name + " " + d.FamilyName + " (" + d.AKA + ")");
            }
            return (d.Name + " " + d.FamilyName);
        });

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


    force.on("tick", function() {
        linkItems.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
   
        nodeItems.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
        .attr("cx", function(d) { return d.x = Math.max(radius*2, Math.min(width - radius*2, d.x)); })
        .attr("cy", function(d) { return d.y = Math.max(radius*2, Math.min(height - radius*2, d.y)); });
    });
}


    

