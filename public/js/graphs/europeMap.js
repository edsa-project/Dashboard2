/**
 * Contains the class for constructing the map of Europe.
 * europe.json was created using
 * data from Natural Earth: http://naturalearthdata.com
 * and GDAL: http://www.gdal.org/ 
 * with topojson (need node.js): npm install -g topojson
 */ 


/**
 * Generates the map of Europe and optionally the timeline.
 * @param {Object} [_options] - The options for constructing the map.
 * @property {string} [_options.mapContainer = null] - The identifier for the map container.
 * @property {string} [_options.timelineContainer = null] - The identifier for the timeline container.
 * @property {Object} [_options.gridSize] - Object containing the min and max grid size used for clustering and visualizing data.
 * @property {Object} [_options.margin] - Object containing the top, left, bottom, right margin size.
 */ 
function EuropeMap(_options) {
    /**
     * The options used at map initialization.
     */ 
    var options = $.extend({
        mapContainer:      null,
        timelineContainer: null,
        infoContainer:     null,
        tooltipType: "Policy Makers",
        gridSize: { min: 20, max: 40 },
        margin: { top: 20, left: 20, bottom: 20, right: 20 }
    }, _options);
    
    /**
     * The variable that contains the function itself (do not override!)
     */ 
    const self = this;

    /**
     * The parameters storage. They are used for manipulating with SVG objects 
     * in multiple functions.
     */ 
    var mapContainer      = undefined,
        timelineContainer = undefined,
        projection        = undefined,
        quadtree          = undefined,
        radiusScale       = undefined,
        gridScale         = undefined,
        x                 = undefined,
        xAxis             = undefined,
        brush             = undefined,
        brushg            = undefined,
        tooltipDiv        = undefined,
        zoom              = undefined,
        zoomEnableFlag    = false;
    
    /**
     * The shown points
     */ 
    var allJobs        = [],
        selectedJobs   = [],
        clusterPoints  = [];
    
    /**
     * Zoom properties: used to save the current zoom state
     */ 
    var scale = 0;
    var trans = [0, 0];
    
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
     * Alpha-3 ISO Code to full country names (only EU countries)
     */ 
    var Alpha3ToFull = {
        'AND': 'Andorra',
        'AUT': 'Austria',
        'BEL': 'Belgium',
        'BGR': 'Bulgaria',
        'CYP': 'Cyprus',
        'CZE': 'Czech Republic',
        'CHE': 'Switzerland',
        'DNK': 'Denmark',
        'DEU': 'Germany',
        'ESP': 'Spain',
        'EST': 'Estonia',
        'FIN': 'Finland',
        'FRA': 'France',
        'GBR': 'United Kingdom',
        'GRC': 'Greece',
        'HUN': 'Hungary',
        'HRV': 'Croatia',
        'IRL': 'Ireland',
        'ITA': 'Italy',
        'LTU': 'Lithuania',
        'LUX': 'Luxembourg',
        'LVA': 'Latvia',
        'MLT': 'Malta',
        'NLD': 'Netherlands',
        'POL': 'Poland',
        'PRT': 'Portugal',
        'ROU': 'Romania',
        'SMR': 'San Marino',
        'UKR': 'Ukraine',
        'SVK': 'Slovakia',
        'SVN': 'Slovenia'
    }

    /**
     * Draws the map of Europe (optional: timeline, if container is specified)
     */ 
    this.DrawMap = function () {
        
        // empty the container
        $(options.mapContainer + " svg").remove();
        
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
                       .scale(800)
                       .translate([mapWidth / 2, mapHeight / 2]);
        
        var path = d3.geo.path()
                     .pointRadius(0.5)
                     .projection(projection);
        
        // graticules at 10 degrees 
        var graticule = d3.geo.graticule()
                          .step([10, 10]);

        zoom = d3.behavior.zoom()
                          .scaleExtent([1, 5])
                          .on("zoom", onZoom);
        
        gridScale = d3.scale.linear()
                      .domain([1, 5])
                      .range([options.gridSize.max, options.gridSize.min]);
        
        tooltipDiv = d3.select("body").append("div")
                                      .attr("class", "graph-tooltip")
                                      .style("display", "none");

        //-------------------------------------------------
        // Map functionality
        //-------------------------------------------------

        // create the svg map container
        var svg = d3.select(options.mapContainer).append("svg:svg")
                .attr("class", "svg-map")
                .attr("width", mapTotalWidth)
                .attr("height", mapTotalHeight)
                .call(zoom)
                // remove the mousewheel/double click zoom
                .on("mousewheel.zoom", null)
                .on("DOMMouseScroll.zoom", null)
                .on("wheel.zoom", null)
                .on("dblclick.zoom", null);
       var hiddenLayer = svg.append("g")
                .attr("transform", "translate(" + options.margin.left + ", " + options.margin.top + ")");

        mapContainer = hiddenLayer.append("g");

        // load the europe data
        d3.json("dashboard/data/map/europe.json", function (error, europe) {
             if (error) { throw error; }
            
            //-----------------------------------
            // Adding countries and it's labels
            //-----------------------------------

            // get the countries from the json file
            var countries = topojson.feature(europe, europe.objects.countries);
            var cities = topojson.feature(europe, europe.objects.cities);
            
            // set the country features
            mapContainer.selectAll(".country")
                     .data(countries.features)
                     .enter().append("path")
                     .attr("class", function (d) {
                        var hidden = nonEU.indexOf(d.id) !== -1 ? " notvisible" : "";
                        return "country" + hidden;
                     })
                     .attr("id", function (d) { return d.id; })
                     .attr("d", path)
                     .on('click', function (d) { SelectCountry(d); });
            
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

            // graticule lines 
            var lines = mapContainer.selectAll('.graticule').data([graticule()]);
            lines.enter().append('path')
                         .attr('class', 'graticule')
                         .attr('d', path);
            lines.exit().remove();
            
            
            //-----------------------------------
            // Adding cities and city labels
            //-----------------------------------

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
            
        });
        
        // Country on click function
        function SelectCountry(d) {
            var selectedCountry = mapContainer.select("#" + d.id);
            selectedCountry.classed("active", selectedCountry.attr("class") != "country active");
        }
        
        //-----------------------------------
        // Zoom functionality
        //-----------------------------------

        // position the zoom container
        $("#zoom-container-map").css({ "left": (mapTotalWidth - 20) + "px" });
        // add the tooltip 
        $(".glyphicon-zoom-in").tooltip({
            container: "#map-container",
            title:     "Enable/disable zooming",
            placement: "left",
            trigger:   "hover"
        });
        // add the zooming toggle functionality
        d3.select(".glyphicon-zoom-in").on("click", function () {
            if (zoomEnableFlag) {
                svg.on("mousewheel.zoom", null)
                   .on("wheel.zoom", null);
            } else {
                zoom.on("zoom", onZoom).translate(trans).scale(scale);
                svg.call(zoom);
            }
            // change the zoom flag
            d3.select(this).classed("active", !zoomEnableFlag);
            zoomEnableFlag = zoomEnableFlag == true ? false : true;
        });


        // the zoom behaviour (panning and boundary limits)
        function onZoom() {
            var sFlag = (d3.event.scale % 1) - (scale % 1) < 0;
            trans = d3.event.translate;
            scale = d3.event.scale;
            var h = mapHeight / 4;
            trans[0] = Math.min(mapWidth / mapHeight * (scale - 1) + 90 * scale, Math.max(mapWidth * (1 - scale) - 90 * scale, trans[0]));
            trans[1] = Math.min(h * (scale - 1) + 3 * h / 4 * scale, Math.max(mapHeight * (1 - scale) - 3 * h / 4 * scale, trans[1]));
            mapContainer.attr("transform", "translate(" + trans + ")scale(" + scale + ")");
            zoom.translate(trans);
            
            // show city labels and location
            if (zoomEnableFlag) {
                if (scale < 2.5) {
                    $(".city").hide();
                    $(".city-label").hide();
                    $(".country-label").show();
                } else {
                    $(".city").show();
                    $(".city-label").show();
                    $(".country-label").hide();
                }
                if (zoomEnableFlag && sFlag && selectedJobs.length != 0) {
                    createJobClusters();
                }
            }
        }
    };

    /**
     * Stores the points and draws the clusters.
     * @param {Array.<Object>} _points - The array containing the points.
     */ 
    this.DrawPoints = function (_points) {
        if (!_points) { throw "Must contain array of coordinates!"; }

        // save the current array of points
        selectedJobs = allJobs = _points;
        // create the timescroll
        createTimeline();
        // construct the clusters
        createJobClusters();
    };
    
    
    //-------------------------------------------------
    // Cluster functionality
    //-------------------------------------------------
    function createJobClusters() {
        
        // get the width and the height of the container
        var totalWidth = $(options.mapContainer).width(),
            totalHeight = $(options.mapContainer).height(),
            width = totalWidth - options.margin.left - options.margin.right,
            height = totalHeight - options.margin.top - options.margin.bottom;
        
        // get the coordinates data of the points
        var pointsRaw = selectedJobs.map(function (d, i) {
            var point = projection(d.location);
            point.push(d.id);
            return point;
        });
        
        // create the quadtree used for the clustering
        quadtree = d3.geom.quadtree()(pointsRaw);
        
        // Find the nodes within the specified rectangle
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
        for (var x = 0; x <= width; x += gridScale(scale)) {
            for (var y = 0; y <= height; y += gridScale(scale)) {
                var searched = search(quadtree, x, y, x + gridScale(scale), y + gridScale(scale));
                
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
        radiusScale = d3.scale.log()
                        .domain([
                            1,
                            d3.max(clusterPoints, function (d) { return d[2].length; })
                        ]).rangeRound([2, 6]);
        
        
        // add the clusters on the map
        var clusters = mapContainer.selectAll(".jobCluster")
                 .data(clusterPoints);
        
        clusters.attr("cx", function (d) { return d[0]; })
               .attr("cy", function (d) { return d[1]; })
               .attr("r", function (d) { return radiusScale(d[2].length); });

        clusters.enter().append("circle")
                 .attr("class", "jobCluster")
                 .attr("cx", function (d) { return d[0]; })
                 .attr("cy", function (d) { return d[1]; })
                 .attr("r", function (d) { return radiusScale(d[2].length); });

        clusters.on("click", function (d, i) {
            if (options.infoContainer) {
                $(options.infoContainer).html(getJobClusterInfo(d));
            }
        });

        clusters.exit().remove();
        
        // getting the information
        clusters.on("mousemove", function (d, i) {
            
            // set the description in the tooltip
            tooltipDiv.html(tooltipBodyConstructor(d, options.tooltipType));
            
            // TODO set the offset of the div container
            var x = d3.event.pageX;
            var y = d3.event.pageY;
            var xOffset = 10;
            var yOffset = 10;
            // set the position of the tooltip
            tooltipDiv.style("left", (x + xOffset) + "px")
                      .style("top", (y + yOffset) + "px")
                      .style("display", "block");
        }).on("mouseout", function (d, idx) {
            tooltipDiv.style("display", "none");
        });
    };
    
    
    //-------------------------------------------------
    // Timeline functionality
    //-------------------------------------------------
    function createTimeline(brushStartEnd) {
        
        if (options.timelineContainer) {
            // empty the container
            $(options.timelineContainer + " svg").remove();

            // get the width and height of the timeline container
            var timelineTotalWidth = $(options.timelineContainer).width(),
                timelineTotalHeight = $(options.timelineContainer).height(),
                timelineWidth = timelineTotalWidth - options.margin.left - options.margin.right,
                timelineHeight = timelineTotalHeight - options.margin.top - options.margin.bottom;
            
            var minTime, maxTime;
            if (allJobs.length != 0) {
                var jobTimestamps = allJobs.map(function (rec) { return rec.timestamp; });
                minTime = new Date(Math.min.apply(null, jobTimestamps));
                maxTime = new Date(Math.max.apply(null, jobTimestamps));
            } else {
                // security, if there are no data, but the function is still called
                minTime = new Date(2000, 1, 1);
                maxTime = new Date();
            }
            var wholeTimeline = [minTime, maxTime];
        
            var format = d3.time.format("%d %b %Y");
        
            // timeline axis domain and range 
            var x = d3.time.scale()
                           .domain(wholeTimeline)
                           .range([0, timelineWidth]);
        
            // create the svg timeline container
            xAxis = d3.svg.axis().scale(x)
                              .innerTickSize(5)
                              .outerTickSize(0)
                              //.tickFormat(format)
                              .orient("bottom");
        
            var svg = d3.select(options.timelineContainer).append("svg")
                            .attr("width", timelineTotalWidth)
                            .attr("height", timelineTotalHeight)
                            .append("g")
                            .attr("transform", "translate(" + options.margin.left + ", 0)");
        
            timelineContainer = svg.append("g");
        
            timelineContainer.append("g")
                                 .attr("class", "x axis")
                                 .attr("transform", "translate(0, " + (timelineTotalHeight - options.margin.bottom) + ")")
                                 .call(xAxis);
        
            // add the brush functionality            
            brush = d3.svg.brush()
                              .x(x)
                              .on("brush", changeView);
        
            var arc = d3.svg.arc()
                            .outerRadius(timelineTotalHeight / 10)
                            .startAngle(0)
                            .endAngle(function (d, i) { return i ? -Math.PI : Math.PI; });
        
        
            brushg = timelineContainer.append("g")
                                      .attr("class", "brush")
                                      .call(brush);
        
            brushg.selectAll(".resize").append("path")
                                       .attr("transform", "translate(0," + (2 * timelineTotalHeight / 5) + ")")
                                       .attr("d", arc);
        
            brushg.selectAll("rect")
                  .attr("y", 5)
                  .attr("height", timelineTotalHeight - 25);
        
            // set the default brush width
            if (brushStartEnd) { brush.extent(brushStartEnd); }
            else { brush.extent(wholeTimeline); }
            timelineContainer.select('.brush').call(brush);
        }
   
        // when timeline brush changes
        function changeView() {
        
            // if there are no points in the cluster
            if (allJobs.length == 0) { return; }
            
            // get the minimum and maximum times in miliseconds
            var timeInterval = brush.extent();
            var minTime = timeInterval[0].getTime();
            var maxTime = timeInterval[1].getTime();
            
            // get the selected jobs (that were published in the time interval)
            selectedJobs = allJobs.filter(function (rec) {
                var timestamp = rec.timestamp;
                return minTime <= timestamp && timestamp <= maxTime;
            });
            // redraw the clusters
            createJobClusters();
        }
    }
    
    this.redraw = function () {
        $(".graph-tooltip").remove();
        $("#map-load-container").css("width", $(".map").width());
        self.DrawMap();
        if (allJobs.length != 0) {
            createTimeline(brush.extent());
            setTimeout(function () {
                createJobClusters();
            }, 1000);
        }
    }

    //-------------------------------------------------
    // Helper functions
    //-------------------------------------------------
    
    var getJobClusterInfo = function(jobCluster) {
        var text = "";
        
        // get the data from the job cluster
        var JobsInCluster = jobCluster[2];
        var NumOfJobs = JobsInCluster.length;
        var JobIds = JobsInCluster.map(function (job) { return job[2] });
        var Jobs = selectedJobs.filter(function (job) {
            return JobIds.indexOf(job.id) != -1;
        });
        // get the skillset
        var skillset = getSkillset(Jobs);
        
        // set the description
        text += "<h4>Cluster data</h4><div style='text-align:justify;'>";
        text += "<b>Number of Jobs:</b> " + NumOfJobs + "</br>";
        text += "<b>Number of Skills:</b> " + skillset.length + "</br>";
        text += "<b>Skill set:</b><ol>";
        for (var SkillN = 0; SkillN < skillset.length; SkillN++) {
            text += "<a onclick=\"queryMe(\'"+ skillset[SkillN].name +"\')\">"+ skillset[SkillN].name + "</a>"+ " (" + skillset[SkillN].count + ")"
            if (SkillN != skillset.length - 1) { text += ", " };
        }
        
        text += "</ol></div></br>";
        return text;  
    }

    var tooltipBodyConstructor = function (jobCluster, dashboardType) {
        if (dashboardType == "Policy Makers") {
            var text = getDescriptionPM(jobCluster);
            return text;
        } else {
            throw "dashboardType is not valid!";
        }
    }
    
    /**
     * Creates the html body of the tooltip.
     */ 
    function getDescriptionPM(jobCluster) {
        var text = "";
        
        // get the data from the job cluster
        var JobsInCluster = jobCluster[2];
        var NumOfJobs = JobsInCluster.length;
        var JobIds = JobsInCluster.map(function (job) { return job[2]; });
        var Jobs = selectedJobs.filter(function (job) {
            return JobIds.indexOf(job.id) != -1;
        });
        // get the skillset
        var skillset = getSkillset(Jobs);
        // the upper bound for # of skills
        var NumOfSkillSet = skillset.length > 5 ? 5 : skillset.length;

        // set the description
        text += "<b>Number of Jobs:</b> " + NumOfJobs + "</br>";
        text += "<b>Number of Skills:</b> " + skillset.length + "</br>";
        text += "<b>Top 5 Skills:</b><ol>";
        for (var SkillN = 0; SkillN < NumOfSkillSet; SkillN++) {
            text += "<li>"+ skillset[SkillN].name + " (" + skillset[SkillN].count + ")" +"</li>";
        }

        text += "</ol>";    
        
        return text;
    }

    /**
     * Creates an array of Objects, containing the name of the skill
     * and it's count number in the cluster.
     * @param {Array.<Object>} Jobs - The array of jobs.
     * @returns The array of Object, containing the name of the skill
     * and it's count number.
     */ 
    function getSkillset(Jobs) {
        var skills = [];
        var knownSkills = {}; var idx = 0;
        // go through all jobs
        for (var JobN = 0; JobN < Jobs.length; JobN++) {
            var jobSkillset = Jobs[JobN].skillset;
            // go through all skills needed for the job
            for (var SkillN = 0; SkillN < jobSkillset.length; SkillN++) {
                var skillName = jobSkillset[SkillN];
                if (knownSkills[skillName] == null) {
                    skills.push({ name: skillName, count: 1 });
                    knownSkills[skillName] = idx++;
                } else {
                    skills[knownSkills[skillName]].count += 1;
                }
            }
        }
        // sort in descending order (based on count)
        function compare(a, b) { return b.count - a.count; }
        skills.sort(compare);
        return skills;
    }

    //-------------------------------------------------
    // Get functions
    //-------------------------------------------------

    /**
     * Gets the active countries.
     * @returns {Array.<String>} The array containing the full country names.
     */ 
    this.getActiveCountries = function () {
        var activeCountries = mapContainer.selectAll(".country.active")[0];
        var countryIds = activeCountries.map(function (obj) { return Alpha3ToFull[obj.id]; });
        return countryIds;
    }

    //-------------------------------------------------
    // Set functions
    //-------------------------------------------------
    
    /**
     * Sets the containers.
     */ 
    this.setContainers = function (json) {
        mapContainer      = json.mapContainer == null ? mapContainer : json.mapContainer;
        infoContainer     = json.infoContainer == null ? infoContainer : json.infoContainer;
        timelineContainer = json.timelineContainer == null ? timelineContainer : json.timelineContainer;
    }


    // resize on window resize
    var resizeTimerMap;
    $(window).resize(function () {
        clearTimeout(resizeTimerMap);
        resizeTimerMap = setTimeout(function () {
            self.redraw();
        }, 1000);
    });
}