/**
 * Contains the class for constructing the map of Europe.
 * europe.json was created using the data from Natural Earth: http://naturalearthdata.com
 * and GDAL: http://www.gdal.org/ 
 * with topojson (need node.js): npm install -g topojson
 */ 

function EuropeMap(_options) {
    var options = $.extend({
        mapContainer: null,
        gridSize: { min: 15, max: 45 },
        multipleSelection: false,
        margin: { top: 20, left: 20, bottom: 20, right: 20 }
    }, _options);
    
    /**
     * The parameters used.
     */ 
    var container = undefined,
        projection = undefined,
        zoom = undefined,
        quadtree = undefined,
        radiusScale = undefined,
        gridScale = undefined;
    
    /**
     * The shown points
     */ 
    var jsonPoints = undefined,
        clusterPoints = [];
    
    /**
     * Zoom properties
     */ 
    var scaleKoef = 1;
    
    /**
     * Draws the map of Europe
     */ 
    this.DrawMap = function () {
        var self = this;
        
        // get the width and the height of the container
        var totalWidth = $(options.mapContainer).width(),
            totalHeight = $(options.mapContainer).height(),
            width = totalWidth - options.margin.left - options.margin.right,
            height = totalHeight - options.margin.top - options.margin.bottom,
            centered;
        
        // the alpha-3 ISO abbreviatons of the non-eu European countries
        var nonEU = ['ALB', 'AND', 'BLR', 'BIH', 'GEO', 'ISL', 'UNK', 'LIE', 
            'MKD', 'MDA', 'MNE', 'NOR', 'SMR', 'SRB', 'CHE', 'UKR', 'VAT'];
        
        // set the projection function from spherical coords to euclidean
        projection = d3.geo.mercator()
                     .center([5, 57.4])
                     .scale(600)
                     .translate([width / 2, height / 2]);
        
        // set the path function
        var path = d3.geo.path()
               .pointRadius(1)
               .projection(projection);
        
        zoom = d3.behavior.zoom()
                 .on("zoom", onZoom);
        
        gridScale = d3.scale.linear()
                      .domain([1, 3])
                      .rangeRound([options.gridSize.max, options.gridSize.min]);
        
        // the zoom behaviour
        function onZoom() {
            container.attr("transform", "translate(" + d3.event.translate + ")scale(" + scaleKoef + ")");
        }
        
        // create the svg container
        var svg = d3.select(options.mapContainer).append("svg")
                .attr("width", totalWidth)
                .attr("height", totalHeight)
                .append("g")
                .attr("transform", "translate(" + options.margin.left + ", " + options.margin.top + ")")
                .call(zoom)
                // remove the mousewheel/double click zoom
                .on("mousewheel.zoom", null)
                .on("DOMMouseScroll.zoom", null)
                .on("wheel.zoom", null)
                .on("dblclick.zoom", null);
        
        svg.append("rect")
           .attr("fill", "#FFFFFF")
           .attr("width", width)
           .attr("height", height);
        
        container = svg.append("g");
        
        // load the europe data
        $.getJSON("dashboard/data/map/europe.json", function (europe) {
            // d3.json("../data/map/europe.json", function (error, europe) {
            // if (error) { return console.error(error); }
            
            // get the countries from the json file
            var countries = topojson.feature(europe, europe.objects.countries);
            var cities = topojson.feature(europe, europe.objects.cities);
            
            //container.append("path")
            //         .datum(countries)
            //         .attr("d", path);
            
            // set the country features
            container.selectAll(".country")
                     .data(countries.features)
                     .enter().append("path")
                     .attr("class", function (d) {
                var hidden = nonEU.indexOf(d.id) !== -1 ? "-hidden" : "";
                return "country" + hidden;
            })
                     .attr("id", function (d) { return d.id; })
                     .attr("d", path)
                     .on('click', function (d) { zoomOnCountry(d, options.multipleSelection); });
            
            // remove the hidden countries - we don't need them in the map
            container.selectAll(".country-hidden").remove();
            
            // create border paths
            container.append("path")
               .datum(topojson.mesh(europe, europe.objects.countries, function (a, b) { return a !== b && nonEU.indexOf(a.id) === -1; }))
               .attr("d", path)
               .attr("class", "country-boundary");
            
            container.append("path")
               .datum(topojson.mesh(europe, europe.objects.countries, function (a, b) { nonEU.indexOf(a.id) !== -1; }))
               .attr("d", path)
               .attr("class", "country-boundary noneu");
            
            /**
             * Zoom on country function
             * DISCLAMER: change this function for selecting multiple countries 
             */ 
            function zoomOnCountry(d, multipleSelection) {
                var xCoord, yCoord;
                
                if (d && centered !== d) {
                    /**
                     * some modification zooming for France it has
                     * islands around the world and that's why it
                     * doesn't zoom in the center of the country
                     */ 
                    var addX = d.id == "FRA" ? 30 : 0;
                    var addY = d.id == "FRA" ? -30 : 0;
                    
                    var centroid = path.centroid(d);
                    xCoord = centroid[0] + addX;
                    yCoord = centroid[1] + addY;
                    scaleKoef = 3;
                    centered = d;
                } else {
                    xCoord = width / 2;
                    yCoord = height / 2;
                    scaleKoef = 1;
                    centered = null;

                }
                /**
                 *  multipleSelection if false: 
                 *  Add/remove the .active class tag to the selected country
                 *  Zoom in to / out from selected country
                 */
                if (!multipleSelection) {
                    
                    container.selectAll(".country")
                             .classed("active", centered && function (d) { return d === centered });
                    
                    // make the transition to that country
                    container.transition()
                         .duration(1000)
                         .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + scaleKoef + ")translate(" + -xCoord + "," + -yCoord + ")")
                         .each("end", setZoomLevel);

                } else {
                    var selectedCountry = container.select("#" + d.id);
                    selectedCountry.classed("active", selectedCountry.attr("class") != "country active");
                    
                    /**
                     * TODO: Must implement the zoom function to the countries
                     */ 
                    scaleKoef = 1;
                }
                
                /**
                 * set the zoom level and the display of 
                 * .city and .city-label objects
                 */
                function setZoomLevel() {
                    var trans = d3.transform(container.attr("transform"));
                    zoom.scale(scaleKoef);
                    zoom.translate(trans.translate);
                    if (centered) {
                        $(".city").show();
                        $(".city-label").show();
                    } else {
                        $(".city").hide();
                        $(".city-label").hide();
                    }
                    // show clusters for jobs
                    if (jsonPoints) {
                        self.PointClustering();
                    }
                }
            }
            
            /**
             * This part adds the city and country labels.
             */ 

            // set the city location as points
            container.append("path")
                     .datum(cities)
                     .attr("d", path)
                     .attr("class", "city");
            
            // set the city label/names 
            container.selectAll(".city-label")
                     .data(cities.features)
                     .enter().append("text")
                     .attr("class", "city-label")
                     .attr("transform", function (d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
                     .attr("dy", ".35em")
                     .text(function (d) { return d.properties.name; })
                     .attr("x", function (d) { return d.geometry.coordinates[0] > -1 ? 3 : -3; })
                     .style("text-anchor", function (d) { return d.geometry.coordinates[0] > -1 ? "start" : "end"; });
            
            
            // set the country label
            container.selectAll(".country-label")
                     .data(countries.features)
                     .enter().append("text")
                     .attr("class", function (d) { return "country-label " + d.id; })
                     .attr("transform", function (d) {
                var addX = d.id == "FRA" ?  40 : 0;
                var addY = d.id == "FRA" ? -40 : 0;
                return "translate(" + (path.centroid(d)[0] + addX) + ", " + (path.centroid(d)[1] + addY) + ")";
            })
                     .attr("dy", ".35em")
                     .text(function (d) {
                if (nonEU.indexOf(d.id) === -1) {
                    return d.properties.name;
                } else {
                    return "";
                }
            });
            
            /**
             * This part adds the grid used for the point clustering.
             */  

            //// add the grid on the map
            //var grid = container.append('g')
            //                    .attr("class", "grid");

            //for (var xGrid = 0; xGrid <= width; xGrid += options.gridSize.min) {
            //    for (var yGrid = 0; yGrid <= height; yGrid += options.gridSize.min) {
            //        grid.append("rect")
            //            .attr({
            //            x: xGrid, 
            //            y: yGrid,
            //            width: options.gridSize.min,
            //            height: options.gridSize.min,
            //            class: "grid"
            //        });
            //    }
            //}
        });
    };
    
    /**
     * Draws the circles/data on the map
     * @param {Array.<Array.<Number>>} _points - The array containing the points.
     */ 
    this.DrawPoints = function (_points) {
        if (!_points) { throw "Must contain array of coordinates!"; }
        var disappearMs = 250;
        var appearMs = 500;
        
        // save the current array of points
        jsonPoints = _points;
        
        //var points = container.selectAll(".point")
        //        .data(jsonPoints);
        
        //// what happens when the points are updated
        //points.transition().duration(disappearMs)                           // the disappear animation
        //      .attr("r", "0px")
        //      .transition().duration(0)                                     // move animation
        //      .attr("cx", function (d) { return projection(d.coord)[0]; })
        //      .attr("cy", function (d) { return projection(d.coord)[1]; })
        //      .transition().duration(appearMs)                              // appear animation
        //      .attr("r", "1px");
        
        //// what happens when the points are added
        //points.enter().append("circle")
        //    .attr("cx", function (d) { return projection(d.coord)[0]; })
        //    .attr("cy", function (d) { return projection(d.coord)[1]; })
        //    .attr("class", "point")
        //    .attr("r", "0px")
        //    .transition().delay(disappearMs)                                // delay for the appear animation for the update points
        //    .duration(appearMs)
        //    .attr("r", "2px");
        
        //// what happens when the points are removed
        //points.exit()
        //    .transition().duration(disappearMs)                             // remove points in the same time as in the update disappear animation
        //    .attr("r", "0px")
        //    .remove();
        
        this.PointClustering();
    };
    
    this.PointClustering = function () {
        
        // get the width and the height of the container
        var totalWidth = $(options.mapContainer).width(),
            totalHeight = $(options.mapContainer).height(),
            width = totalWidth - options.margin.left - options.margin.right,
            height = totalHeight - options.margin.top - options.margin.bottom;
        
        // get the coordinates data of the points
        var pointsRaw = jsonPoints.map(function (d, i) {
            var point = projection(d.coord);
            point.push(i);
            return point;
        });
        
        // create the quadtree used for the clustering
        quadtree = d3.geom.quadtree()(pointsRaw);
        
        // Find the nodes within the specified rectangle.
        function search(quadtree, x0, y0, x3, y3) {
            var validData = [];
            quadtree.visit(function (node, x1, y1, x2, y2) {
                var p = node.point;
                if (p) {
                    p.selected = (p[0] >= x0) && (p[0] < x3) && (p[1] >= y0) && (p[1] < y3);
                    if (p.selected) {
                        validData.push(p);
                    }
                }
                return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
            });
            return validData;
        }
        clusterPoints = [];
        for (var x = 0; x <= width; x += gridScale(scaleKoef)) {
            for (var y = 0; y <= height; y += gridScale(scaleKoef)) {
                var searched = search(quadtree, x, y, x + gridScale(scaleKoef), y + gridScale(scaleKoef));
                
                var centerPoint = searched.reduce(function (prev, current) {
                    return [prev[0] + current[0], prev[1] + current[1]];
                }, [0, 0]);
                
                centerPoint[0] = centerPoint[0] / searched.length;
                centerPoint[1] = centerPoint[1] / searched.length;
                centerPoint.push(searched);
                
                if (centerPoint[0] && centerPoint[1]) {
                    clusterPoints.push(centerPoint);
                }
            }
        }
        
        // set the radius scale 
        radiusScale = d3.scale.linear()
                        .domain([
            d3.min(clusterPoints, function (d) { return d[2].length; }),
            d3.max(clusterPoints, function (d) { return d[2].length; })
        ])
                        .rangeRound([2, 8]);
        
        
        // add the clusters on the map
        var clusters = container.selectAll(".clusterPoint")
                 .data(clusterPoints);
        
        clusters.enter().append("circle")
                 .attr("class", "clusterPoint")
                 .attr("cx", function (d) { return d[0]; })
                 .attr("cy", function (d) { return d[1]; })
                 .attr("r", function (d) { return radiusScale(d[2].length); })
                 .on("click", function (d, i) {
            console.log(d);
        });
        clusters.exit().remove();
    };
}