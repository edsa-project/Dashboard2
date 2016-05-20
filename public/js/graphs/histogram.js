

function Histogram(_options) {
    /**
     * The options used at histogram initialization.
     */ 
    var options = $.extend({
        histogramContainer: null,
        histogramName:      null,
        xAxisType:          null,
        zoomable:           null,
        margin: { top: 50, left: 70, bottom: 100, right: 30 }
    }, _options);

    /**
     * The variable that contains the function itself (do not override!)
     */ 
    const self = this;

    /**
     * Te parameter storage. They are used for manipulating with SVG objects 
     * in multiple functions.
     */ 
    var svg                = undefined,
        rectClip           = undefined,
        histogramContainer = undefined,
        x                  = undefined,
        y                  = undefined, 
        xAxis              = undefined,
        yAxis              = undefined,
        zoom               = undefined,
        histogramName      = undefined,
        maxValue           = 0;

    /**
     * Data storage.
     * @property {Object} dataset - A JSON object containing the dataset info.
     * { name: String, yAttribute: String, data: [{ name: String, value: number }] }
     */ 
    var dataset = undefined;

    /**
     * Set the data in the histogram and redraw's it.
     */ 
    this.setData = function (_data) {
        if (_data == undefined) {
            throw "No data specified!";
        }
        dataset = _data;
        self.draw();
    }

    /**
     * Redraws the histogram.
     */ 
    this.draw = function () {
        
        // empty the container
        $(options.histogramContainer + " svg").remove();
        $(".histogram" + (histogramName != "" ? "." + histogramName : "") + ".d3-tip").remove();

        var histogramTotalHeight = $(options.histogramContainer).height(),
            histogramTotalWidth  = $(options.histogramContainer).width(),
            histogramHeight = histogramTotalHeight - options.margin.top - options.margin.bottom,
            histogramWidth  = histogramTotalWidth - options.margin.left - options.margin.right;

        // calculations for the bar properties
        maxValue      = d3.max(dataset.data, function (d) { return d.value; });
        histogramName = options.histogramName ? "histogram-" + options.histogramName : "";

        // set the x axis
        if (options.xAxisType == "timestamp") {
            x = d3.time.scale()
                       .range([0, histogramWidth])
                       .domain([dataset.data[0].name, dataset.data[dataset.data.length - 1].name]);
        
            xAxis = d3.svg.axis()
                          .scale(x)
                          .orient("bottom");
        } else {
            x = d3.scale.ordinal()
                   .rangeRoundBands([0, histogramWidth], .1)
                   .domain(dataset.data.map(function (d) { return d.name; }));
            
            xAxis = d3.svg.axis()
                      .scale(x)
                      .orient("bottom");
        }
        // set the y axis
        y = d3.scale.linear()
                    .domain([0, maxValue])
                    .range([histogramHeight, 0]);
        
        yAxis = d3.svg.axis()
                      .scale(y)
                      .ticks(10)
                      .tickSize(-histogramWidth)
                      .outerTickSize(0)
                      .tickFormat(d3.format("s"))
                      .orient("left");
        
        // setting the tooltip
        var tip = d3.tip()
                    .attr("class", "histogram " + histogramName + " d3-tip")
                    .offset([-10, 0])
                    .html(function (d) {
                        var name = options.zoomable? d.name.toDateString() : d.name;
                        var htmlText = "<div style='text-align:center;'>" + name + "</div>";
                        htmlText += "<strong># of jobs:</strong> <span style='color:red'>" + d.value + "</span>";
                        return htmlText;
                    });

        // create the svg histogram container
        svg = d3.select(options.histogramContainer).append("svg")
                    .attr("class", "histogram" + (options.histogramName ? " histogram-" + options.histogramName : ""))
                    .attr("width", histogramTotalWidth)
                    .attr("height", histogramTotalHeight);
        
        // if histogram is zoomable            
        if (options.zoomable) {
            zoom = d3.behavior.zoom()
                              .x(x)
                              .scaleExtent([1, 1000])
                              .on("zoom", onZoom);
            svg.call(zoom);
        }
        
        var clip = svg.append("defs").append("svg:clipPath")
                      .attr("id", "clip")
                      .append("rect")
                      .attr("id", "clip-rect")
                      .attr("x", 0)
                      .attr("y", 0)
                      .attr("height", histogramHeight)
                      .attr("width", histogramWidth);
        
        histogramContainer = svg.append("g")
                                .attr("transform", "translate(" + options.margin.left + "," + options.margin.top + ")")
                                .append("g");

        histogramContainer.call(tip);

        // x axis and labels
        histogramContainer.append("g")
                          .attr("class", "x axis")
                          .attr("transform", "translate(0," + histogramHeight + ")")
                          .call(xAxis);

        if (options.xAxisType != "timestamp") {
            histogramContainer.selectAll("text")
                              .attr("class", "x-labels")
                              .attr("y", 7)
                              .attr("x", -5)
                              .attr("transform", "rotate(-50)")
                              .style("text-anchor", "end");
        }
        
        // y axis and labels
        var gyAxis = histogramContainer.append("g")
                                   .attr("class", "y axis")
                                   .call(yAxis);
        
        gyAxis.selectAll("g").filter(function (d) { return d; })
                             .classed("minor", true);
        
        gyAxis.append("text")
              .attr("transform", "rotate(-90)")
              .attr("x", -histogramTotalHeight / 3)
              .attr("y", -35)
              .style("font-size", "12px")
              .style("text-anchor", "end")
              .text(dataset.yAttribute);
        
        // append title of histogram
        histogramContainer.append("text")
              .attr("class", "title")
              .attr("x", histogramTotalWidth / 2)
              .attr("y", -10)
              .style("font-size", "18px")
              .style("font-family",  "sans-serif")
              .style("text-anchor", "end")
              .text(dataset.name);
        
        // create chart  
        var chart = histogramContainer.append("g")
                          .attr("id", "chart-body")
                          .attr("clip-path", "url(#clip)")
                          .selectAll(".bar")
                          .data(dataset.data);
        
        var barW = barWidth();

        chart.enter().append("rect")
                     .attr("class", "bar")
                     .attr("x", function (d) {
                        var xOffset = options.zoomable ? -barW * 0.3 : barW * 0.2;
                        return x(d.name) + xOffset;
                      })
                     .attr("y", function (d) { return histogramHeight; })
                     .attr("width", barW * 0.6)
                     .attr("height", function (d) { return 0; })
                     .on('mouseover', tip.show)
                     .on('mouseout', tip.hide)
                     .transition().duration(1000)
                     .attr("y", function (d) { return y(d.value); })
                     .attr("height", function (d) { return histogramHeight - y(d.value); })
                     
        chart.exit().remove();
        
        
    }
    
    this.redraw = function () { 
        var histogramTotalHeight = $(options.histogramContainer).height(),
            histogramTotalWidth = $(options.histogramContainer).width(),
            histogramHeight = histogramTotalHeight - options.margin.top - options.margin.bottom,
            histogramWidth = histogramTotalWidth - options.margin.left - options.margin.right;

        svg.attr("width", histogramTotalWidth)
           .attr("height", histogramTotalHeight);
        
        // set the x axis
        if (options.xAxisType == "timestamp") {
            x.range([0, histogramWidth]);
            xAxis.scale(x);
        } else {
            x.rangeRoundBands([0, histogramWidth], .1);
            xAxis.scale(x);
        }
        
        yAxis.tickSize(-histogramWidth)
                          .outerTickSize(0);
        
        // if histogram is zoomable            
        if (options.zoomable) {
            zoom.x(x);
        }
        
        svg.select("#clip-rect")
           .attr("x", 0)
           .attr("y", options.margin.top)
           .attr("height", histogramTotalHeight)
           .attr("width", histogramWidth);

        histogramContainer.select(".x.axis")
                          .call(xAxis);

        if (options.xAxisType != "timestamp") {
            histogramContainer.selectAll(".x-labels")
                              .attr("y", 7)
                              .attr("x", -5)
                              .attr("transform", "rotate(-50)")
                              .style("text-anchor", "end");
        }
        
        // y axis and labels
        var gyAxis = histogramContainer.select(".y.axis")
                                   .call(yAxis);
                
        gyAxis.selectAll(".minor")
              .attr("x", -histogramHeight / 2)
              .attr("y", -35)
              .style("font-size", "12px")
              .style("text-anchor", "end");
        
        // append title of histogram
        histogramContainer.select(".title")
              .attr("x", histogramTotalWidth / 2)
              .attr("y", -10)
              .style("text-anchor", "center");
        
        var barW = barWidth();

        var chart = histogramContainer.select("#chart-body")
                                      .attr("clip-path", "url(#clip)");
 
        chart.selectAll(".bar")
                     .attr("x", function (d) {
                         var xOffset = options.zoomable ? -barW * 0.3 : barW * 0.2;
                         return x(d.name) + xOffset;
                     })
                     .attr("width", barW * 0.6)

    }

    //-----------------------------------------
    // Helper functions
    //-----------------------------------------

    var capitalizeString = function (str) {
        return str.replace(/(?:^|\s)\S/g, function (a) { return a.toUpperCase(); });
    };
    
    // calculates the width of the bars
    function barWidth() {
        var histogramTotalWidth = $(options.histogramContainer).width(),
            histogramWidth = histogramTotalWidth - options.margin.left - options.margin.right;

        if (options.zoomable) {
            var firstDate = dataset.data[0].name, 
                lastDate = dataset.data[dataset.data.length - 1].name;
            return histogramWidth / dayDiff(firstDate, lastDate);
        } else {
            return histogramWidth / dataset.data.length;
        }
    }

    // gets the number of days between two dates
    function dayDiff(first, second) {
        return Math.round((second - first) / (1000 * 60 * 60 * 24));
    }
    
    // zoom functionality
    function onZoom() {
        var barW = barWidth();
        svg.select(".x.axis").call(xAxis);
        histogramContainer.selectAll("rect.bar")
                              .attr("x", function (d) { return x(d.name) - barW * d3.event.scale * 0.3; })
                              .attr("width", barW * d3.event.scale * 0.6)
    }
    

    // resize on window resize 
    var resizeTimerHist;
    $(window).resize(function () {
        self.redraw();
    });
}