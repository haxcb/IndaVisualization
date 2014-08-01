var width = 800,
	height = 900,
	radius = 5;

var force = d3.layout.force()
	.charge(-500)
	.linkDistance(50)
	.size([width, height]);

var svg = d3.select(".container").append("svg")
	.attr("width", width)
	.attr("height", height);
		
var nodes = [],
    links = [];


function createLinks(relationshipType, people,sourceIndex) {
    for (var p in people) {
        var targetIndex = -1;
        for(var j in nodes) {
            if(people[p] == nodes[j].Name + " " + nodes[j].FamilyName + " (" + nodes[j].AKA + ")" )  {
                targetIndex = nodes[j].Index;
            }
        }
        if (!(targetIndex == -1)) {
            links.push({ "type": relationshipType, 
                     "target": +targetIndex, 
                     "source": +sourceIndex });
        }
    };
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
        "ParentOf": d3.csv.parseRows(csv.ParentOf.replace(/\s*;\s*/g, ","))[0],
        "SpouseOrBetrothed": d3.csv.parseRows(csv.SpouseOrBetrothed.replace(/\s*;\s*/g, ","))[0],
        "InloveWith": d3.csv.parseRows(csv.InloveWith.replace(/\s*;\s*/g, ","))[0],
        "ChildOf": d3.csv.parseRows(csv.ChildOf.replace(/\s*;\s*/g, ","))[0],
        "Siblings": d3.csv.parseRows(csv.Siblings.replace(/\s*;\s*/g, ","))[0],
        "AcademyClassmates": d3.csv.parseRows(csv.AcademyClassmates.replace(/\s*;\s*/g, ","))[0],
        "CousinsWith": d3.csv.parseRows(csv.CousinsWith.replace(/\s*;\s*/g, ","))[0],
        "RunnerFor": csv.RunnerFor,
        "PimRyala":  d3.csv.parseRows(csv.PimRyala.replace(/\s*;\s*/g, ","))[0],
        "KodlMarines":  d3.csv.parseRows(csv.KodlMarines.replace(/\s*;\s*/g, ","))[0],
        "AcademyTeacherFor":  d3.csv.parseRows(csv.AcademyTeacherFor.replace(/\s*;\s*/g, ","))[0],
    };
}, function(error, rows){
    console.log(rows);

    for(var i in rows) {
        createLinks("ParentOf", rows[i].ParentOf,i);
        createLinks("SpouseOrBetrothed", rows[i].SpouseOrBetrothed,i);
        createLinks("InloveWith", rows[i].InloveWith,i);
        createLinks("ChildOf", rows[i].ChildOf,i);
        createLinks("Siblings", rows[i].Siblings,i);
        createLinks("AcademyClassmates", rows[i].AcademyClassmates,i);
        createLinks("AcademyTeacherFor", rows[i].AcademyTeacherFor,i);
        createLinks("CousinsWith", rows[i].CousinsWith,i);
        createLinks("RunnerFor", rows[i].RunnerFor,i);
        createLinks("PimRyala", rows[i].PimRyala,i);
        createLinks("KodlMarines", rows[i].KodlMarines,i);
    }

    force
        .nodes(nodes)
        .links(links)
        .start();

    links = svg.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("class", "link")
        .style("stroke-width", function(d) { return Math.sqrt(d.value); });

    nodes = svg.selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("r", radius)
        .call(force.drag);
            
    nodes.append("circle")      
        .attr("r", radius);
    
    nodes.append("text")
        .attr("dx", 12)
        .attr("dy", ".35em")
        .style("fill", "black")
        .text(function(d) {return d.Name});

    force.on("tick", function() {
        links.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
   
        nodes.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
        .attr("cx", function(d) { return d.x = Math.max(radius*2, Math.min(width - radius*2, d.x)); })
        .attr("cy", function(d) { return d.y = Math.max(radius*2, Math.min(height - radius*2, d.y)); });
    });

});


    

