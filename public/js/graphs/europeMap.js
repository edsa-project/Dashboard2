
var width = $(".map-container").width(),
    height = $(".map-container").height();

var padding = { top: 20, left: 20, bottom: 20, right: 20 };
var nonEU = ['ALB', 'BLR', 'BIH', 'GEO', 'ISL', 'MKD', 'MNE', 'SRB', 'TUR', 'UKR'];
var svg = d3.select(".map-container").append("svg")
          .attr("width", width)
          .attr("height", height)
          .attr("transform", "translate(" + padding.left + ", " + padding.bottom + ")")
          .append("g");

d3.json("static/data/map/europe.json", function (error, europe) {
    if (error) return console.error(error);
    console.log(europe);
    
    var countries = topojson.feature(europe, europe.objects.countries);
    var projection = d3.geo.albers()
                     .center([8, 55.4])
                     .rotate([-8.4, 0])
                     .parallels([50, 60])
                     .scale(800)
                     .translate([width / 2, height / 2]);
    var path = d3.geo.path()
               .projection(projection);

    svg.append("path")
      .datum(countries)
      .attr("d", path);

    svg.selectAll(".country")
       .data(topojson.feature(europe, europe.objects.countries).features)
       .enter().append("path")
       .attr("class", function (d) {
        var hide = nonEU.indexOf(d.id) !== -1 ? "hide" : "";
        return "country" + hide;
    })
       .attr("id", function (d) { return d.id; })
       .attr("d", path)
       .on('click', function (d) { 
            console.log(d.id);
        });

    svg.append("path")
        .datum(topojson.mesh(europe, europe.objects.countries, function (a, b) { return a !== b && nonEU.indexOf(a.id) === -1; }))
        .attr("d", path)
        .attr("class", "country-boundary");
    
    svg.append("path")
    .datum(topojson.mesh(europe, europe.objects.countries, function (a, b) { return (a!== b || a === b) && nonEU.indexOf(a.id) !== -1; }))
        .attr("d", path)
        .attr("class", "country-boundary NONEU");

    svg.append("path")
        .datum(topojson.feature(europe, europe.objects.cities))
        .attr("d", path)
        .attr("class", "city");

    svg.selectAll(".place-label")
        .data(topojson.feature(europe, europe.objects.cities).features)
        .enter().append("text")
        .attr("class", "place-label")
        .attr("transform", function (d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
        .attr("dy", ".35em")
        .style("font-size", "8px")
        .text(function (d) { return d.properties.name; });

    svg.selectAll(".place-label")
        .attr("x", function (d) { return d.geometry.coordinates[0] > -1 ? 6 : -6; })
        .style("text-anchor", function (d) { return d.geometry.coordinates[0] > -1 ? "start" : "end"; });
});