/**
 * Contains the class for constructing the map of Europe.
 * europe.json was created using the data from Natural Earth: http://naturalearthdata.com
 * and GDAL: http://www.gdal.org/ 
 * with topojson (need node.js): npm install -g topojson
 */ 


/**
 * Generates the map of Europe and optionally the timeline.
 * @param {Object} [_options] - The options for constructing the map.
 * @property {string} [_options.mapContainer = null] - The identifier for the map container.
 * @property {string} [_options.timelineContainer = null] - The identifier for the timeline container.
 * @property {Object} [_options.gridSize] - Object containing the min and max grid size used for clustering and visualizing data.
 * @property {boolean} [_options.multipleSelection = false] - Flag for allowing multiple country selection.
 * @property {Object} [_options.margin] - Object containing the top, left, bottom, right margin size.
 */ 
function EuropeMap(_options) {
    /**
     * The options used at map initialization.
     */ 
    var options = $.extend({
        mapContainer: null,
        timelineContainer: null,
        gridSize: { min: 15, max: 45 },
        multipleSelection: false,
        margin: { top: 20, left: 20, bottom: 20, right: 20 }
    }, _options);
    
    /**
     * The parameters storage. They are used for manipulating with SVG objects 
     * in multiple functions.
     */ 
    var mapContainer      = undefined,
        timelineContainer = undefined,
        projection        = undefined,
        zoom              = undefined,
        quadtree          = undefined,
        radiusScale       = undefined,
        gridScale         = undefined,
        x                 = undefined,
        xAxis             = undefined,
        brush             = undefined;
    
    /**
     * The shown points
     */ 
    var jsonPoints = undefined,
        clusterPoints = [];
    
    /**
     * Zoom properties (don't allow mousewheel or double-click zooming)
     */ 
    var scaleKoef = 1;
    
    /**
     * Alpha-3 to Alpha-2 ISO code (only EU countries)
     */ 
    var Alpha3To2 = {
        'AND': 'AD',    // Andorra
        'AUT': 'AT',    // Austria
        'BEL': 'BE',    // Belgium
        'BGR': 'BG',    // Bulgaria
        'CYP': 'CY',    // Cyprus
        'CZE': 'CZ',    // Czech Republic
        'CHE': 'CH',    // Switzerland
        'DNK': 'DK',    // Denmark
        'DEU': 'DE',    // Germany
        'ESP': 'ES',    // Spain
        'EST': 'EE',    // Estonia
        'FIN': 'FI',    // Finland
        'FRA': 'FR',    // France
        'GBR': 'GB',    // United Kingdom
        'GRC': 'GR',    // Greece
        'HUN': 'HU',    // Hungary
        'HRV': 'HR',    // Croatia
        'IRL': 'IE',    // Ireland
        'ITA': 'IT',    // Italy
        'LTU': 'LT',    // Lithuania
        'LUX': 'LU',    // Luxembourg
        'LVA': 'LV',    // Latvia
        'MLT': 'MT',    // Malta
        'NLD': 'NL',    // Netherlands
        'POL': 'PL',    // Poland
        'PRT': 'PT',    // Portugal
        'ROU': 'RO',    // Romania
        'SMR': 'SM',    // San Marino
        'UKR': 'UA',    // Ukraine
        'SVK': 'SK',    // Slovakia
        'SVN': 'SI',    // Slovenia
        'VAT': 'VA'     // holy city of Vatican
    };
    
    /**
     * Alpha-2 to Alpha-3 ISO code (only EU countries)
     */ 
    var Alpha2To3 = {
        'AD': 'AND',    // Andorra
        'AT': 'AUT',    // Austria
        'BE': 'BEL',    // Belgium
        'BG': 'BGR',    // Bulgaria
        'CY': 'CYP',    // Cyprus
        'CZ': 'CZE',    // Czech Republic
        'CH': 'CHE',    // Switzerland
        'DK': 'DNK',    // Denmark
        'DE': 'DEU',    // Germany
        'ES': 'ESP',    // Spain
        'EE': 'EST',    // Estonia
        'FI': 'FIN',    // Finland
        'FR': 'FRA',    // France
        'GB': 'GBR',    // United Kingdom
        'GR': 'GRC',    // Greece
        'HU': 'HUN',    // Hungary
        'HR': 'HRV',    // Croatia
        'IE': 'IRL',    // Ireland
        'IT': 'ITA',    // Italy
        'LT': 'LTU',    // Lithuania
        'LU': 'LUX',    // Luxembourg
        'LV': 'LVA',    // Latvia
        'MT': 'MLT',    // Malta
        'NL': 'NLD',    // Netherlands
        'PL': 'POL',    // Poland
        'PT': 'PRT',    // Portugal
        'RO': 'ROU',    // Romania
        'SM': 'SMR',    // San Marino
        'UA': 'UKR',    // Ukraine
        'SK': 'SVK',    // Slovakia
        'SI': 'SVN',    // Slovenia
        'VA': 'VAT'     // holy city of Vatican
    };


    /**
     * Draws the map of Europe (optional: timeline, if container is specified)
     */ 
    this.DrawMap = function () {
        var self = this;
        
        // get the width and the height of the map container
        var mapTotalWidth  = $(options.mapContainer).width(),
            mapTotalHeight = $(options.mapContainer).height(),
            mapWidth       = mapTotalWidth - options.margin.left - options.margin.right,
            mapHeight      = mapTotalHeight - options.margin.top - options.margin.bottom,
            centered;

        // the alpha-3 ISO codes of the Non-EU European countries
        var nonEU = ['ALB', 'AND', 'BLR', 'BIH', 'GEO', 'ISL', 'UNK', 'LIE', 
            'MKD', 'MDA', 'MNE', 'NOR', 'SMR', 'SRB', 'CHE', 'UKR', 'VAT'];
        
        // set the projection function from spherical coords to euclidean
        projection = d3.geo.vanDerGrinten()
                       .center([5, 55])
                       .scale(750)
                       .translate([mapWidth / 2, mapHeight / 2]);
        
        var path = d3.geo.path()
                     .pointRadius(1)
                     .projection(projection);
        
        // graticules at 10 degrees 
        var graticule = d3.geo.graticule()
                          .step([10, 10]);

        zoom = d3.behavior.zoom()
                 .on("zoom", onZoom);
        
        gridScale = d3.scale.linear()
                      .domain([1, 3])
                      .rangeRound([options.gridSize.max, options.gridSize.min]);

        // create the svg map container
        var svg = d3.select(options.mapContainer).append("svg")
                .attr("width", mapTotalWidth)
                .attr("height", mapTotalHeight)
                .append("g")
                .attr("transform", "translate(" + options.margin.left + ", " + options.margin.top + ")")
                .call(zoom)
                // remove the mousewheel/double click zoom
                .on("mousewheel.zoom", null)
                .on("DOMMouseScroll.zoom", null)
                .on("wheel.zoom", null)
                .on("dblclick.zoom", null);
        
        svg.append("rect")
           .attr("fill", "transparent")
           .attr("width", mapWidth)
           .attr("height", mapHeight);
        
        mapContainer = svg.append("g");
        
        // construct the timeline 
        if (options.timelineContainer) {
            
            // get the width and height of the timeline container
            var timelineTotalWidth = $(options.timelineContainer).width(),
                timelineTotalHeight = $(options.timelineContainer).height(),
                timelineWidth = timelineTotalWidth - options.margin.left - options.margin.right,
                timelineHeight = timelineTotalHeight - options.margin.top - options.margin.bottom;

            // timeline axis domain and range 
            var x = d3.time.scale().range([0, timelineWidth])
                                   .domain([new Date(2016, 4, 1), new Date(2016, 4, 7)]);           // TODO change to appropriate domain (dynamically, min time - max time)
                                                                     // longest interval approx. 3 months
            // create the svg timeline container
            xAxis = d3.svg.axis().scale(x).orient("bottom");

            var svg = d3.select(options.timelineContainer).append("svg")
                        .attr("width", timelineTotalWidth)
                        .attr("height", timelineTotalHeight)
                        .append("g")
                        .attr("transform", "translate(" + options.margin.left + ", 0)");
            
            svg.append("rect")
               .attr("fill", "transparent")
               .attr("width", timelineWidth)
               .attr("height", timelineHeight);

            timelineContainer = svg.append("g");

            timelineContainer.append("g")
                             .attr("class", "x axis")
                             .attr("transform", "translate(0, " + (timelineTotalHeight - options.margin.bottom) + ")")
                             .call(xAxis);

            brush = d3.svg.brush().x(x).on("brush", changeView);

            timelineContainer.append("g")
                             .attr("class", "x brush")
                             .call(brush)
                             .selectAll("rect")
                             .attr("y", -6)
                             .attr("height", timelineTotalHeight - 15);
        }
        

        // load the europe data
        d3.json("dashboard/data/map/europe.json", function (error, europe) {
             if (error) { throw error; }
            
            // get the countries from the json file
            var countries = topojson.feature(europe, europe.objects.countries);
            var cities = topojson.feature(europe, europe.objects.cities);
            
            // set the country features
            mapContainer.selectAll(".country")
                     .data(countries.features)
                     .enter().append("path")
                     .attr("class", function (d) {
                        var hidden = nonEU.indexOf(d.id) !== -1 ? "-hidden" : "";
                        return "country" + hidden;
                     })
                     .attr("id", function (d) { return d.id; })
                     .attr("d", path)
                     .on('click', function (d) { zoomOnCountry(d, options.multipleSelection); });
            
            //mapContainer.selectAll(".country-hidden").remove();
            
            // graticule lines 
            var lines = mapContainer.selectAll('.graticule').data([graticule()]);
            lines.enter().append('path')
                         .attr('class', 'graticule')
                         .attr('d', path);
            lines.exit().remove();
            
            
            /**
             * This part adds the city and country labels.
             */ 

            // set the city location as points
            mapContainer.append("path")
                        .datum(cities)
                        .attr("d", path)
                        .attr("class", "city");
            
            // set the city label/names 
            mapContainer.selectAll(".city-label")
                        .data(cities.features)
                        .enter().append("text")
                        .attr("class", "city-label")
                        .attr("transform", function (d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
                        .attr("dy", ".35em")
                        .text(function (d) { return d.properties.name; })
                        .attr("x", function (d) { return d.geometry.coordinates[0] > -1 ? 3 : -3; })
                        .style("text-anchor", function (d) { return d.geometry.coordinates[0] > -1 ? "start" : "end"; });
            
            
            // set the country label
            mapContainer.selectAll(".country-label")
                        .data(countries.features)
                        .enter().append("text")
                        .attr("class", function (d) { return "country-label " + d.id; })
                        .attr("transform", function (d) {
                            var addX = d.id == "FRA" ?  65 : 0;
                            var addY = d.id == "FRA" ? -60 : 0;
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
             * Zoom on country function
             * DISCLAMER: change this function for selecting multiple countries 
             */ 
            function zoomOnCountry(d, multipleSelection) {
                var xCoord, yCoord;
                
                if (d && centered !== d) {
                    /**
                     * some modification placing France label: France 
                     * has islands around the world and that's why it
                     * doesn't move in the center of the country
                     */ 
                    var addX = d.id == "FRA" ? 60 : 0;
                    var addY = d.id == "FRA" ? -50 : 0;
                    
                    var centroid = path.centroid(d);
                    xCoord = centroid[0] + addX;
                    yCoord = centroid[1] + addY;
                    scaleKoef = 2.5;
                    centered = d;
                } else {
                    xCoord = mapWidth / 2;
                    yCoord = mapHeight / 2;
                    scaleKoef = 1;
                    centered = null;

                }
                /**
                 *  multipleSelection if false: 
                 *  Add/remove the .active class tag to the selected country
                 *  Zoom in to / out from selected country
                 */
                if (!multipleSelection) {
                    mapContainer.selectAll(".country")
                             .classed("active", centered && function (d) { return d === centered });
                    
                    // make the transition to that country
                    mapContainer.transition()
                         .duration(1000)
                         .attr("transform", "translate(" + mapWidth / 2 + "," + mapHeight / 2 + ")scale(" + scaleKoef + ")translate(" + -xCoord + "," + -yCoord + ")")
                         .each("end", setZoomLevel);
                } 
                /**
                 * multiSelection if true:
                 * implement the zooming/paning functionality
                 */ 
                else {
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
                    var trans = d3.transform(mapContainer.attr("transform"));
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
        });

        // the zoom behaviour (panning and boundary limits)
        function onZoom() {
            var t = d3.event.translate,
                s = scaleKoef;
            var h = mapHeight / 4;
            t[0] = Math.min(mapWidth / mapHeight * (s - 1) + 90 * s, Math.max(mapWidth * (1 - s) - 90 * s, t[0]));
            t[1] = Math.min(h * (s - 1) + 3 * h / 4 * s, Math.max(mapHeight * (1 - s) - 3 * h / 4 * s, t[1]));
            zoom.translate(t);
            mapContainer.attr("transform", "translate(" + t + ")scale(" + s + ")");
        }

        // when timeline brush changes
        function changeView() {
            // TODO write the code for showing clusters
            // console.log(brush.extent());
        }
    };
    
    /**
     * Stores the points and draws the clusters.
     * @param {Array.<Array.<Number>>} _points - The array containing the points.
     */ 
    this.DrawPoints = function (_points) {
        if (!_points) { throw "Must contain array of coordinates!"; }
        
        // save the current array of points
        jsonPoints = _points; 
        this.PointClustering();
    };
    
    /**
     * Creates the clusters and draws them on the map.
     * TODO: Check if function still works and change the functionality
     */ 
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
        var clusters = mapContainer.selectAll(".clusterPoint")
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