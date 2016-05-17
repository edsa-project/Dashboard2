

function Histogram(_options) {
    /**
     * The options used at histogram initialization.
     */ 
    var options = $.extend({
        histogramContainer: null,
        histogramName:      null,
        margin: { top: 50, left: 80, bottom: 100, right: 30 }
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
        histogramContainer = undefined,
        x                  = undefined,
        y                  = undefined, 
        xAxis              = undefined,
        yAxis              = undefined,
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
        maxValue = d3.max(dataset.data, function (d) { return d.value; });
        histogramName = options.histogramName ? "histogram-" + options.histogramName : "";

        // set the x axis
       x = d3.scale.ordinal()
                        .rangeRoundBands([0, histogramWidth], .1)
                        .domain(dataset.data.map(function (d) { return d.name; }));
        
        xAxis = d3.svg.axis()
                          .scale(x)
                          .orient("bottom");
        
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
        
        var tip = d3.tip()
                    .attr("class", "histogram " + histogramName + " d3-tip")
                    .offset([-10, 0])
                    .html(function (d) {
                        return "<strong>" + capitalizeString(options.histogramName) + ":</strong> <span style='color:red'>" + d.value + "</span>";
                    });

        // create the svg histogram container
        svg = d3.select(options.histogramContainer).append("svg")
                    .attr("class", "histogram" + (options.histogramName ? " histogram-" + options.histogramName : ""))
                    .attr("width", histogramTotalWidth)
                    .attr("height", histogramTotalHeight)
        histogramContainer = svg.append("g")
                                .attr("transform", "translate(" + options.margin.left + "," + options.margin.top + ")")
                                .append("g");
        
        histogramContainer.call(tip);

        // x axis and labels
        histogramContainer.append("g")
                          .attr("class", "x axis")
                          .attr("transform", "translate(0," + histogramHeight + ")")
                          .call(xAxis)
                          .selectAll("text")
                          .attr("y", 7)
                          .attr("x", -5)
                          .attr("transform", "rotate(-50)")
                          .style("text-anchor", "end");
        
        // y axis and labels
        var gyAxis = histogramContainer.append("g")
                                   .attr("class", "y axis")
                                   .call(yAxis);
        
        gyAxis.selectAll("g").filter(function (d) { return d; })
                             .classed("minor", true);
        
        gyAxis.append("text")
              .attr("transform", "rotate(-90)")
              .attr("x", -histogramHeight / 2)
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
        var chart = histogramContainer.selectAll(".bar")
                          .data(dataset.data);
        
        //chart.attr("x", function (d) { return x(d.name) + x.rangeBand() * 0.25; })
        //     .attr("y", function (d) { return y(d.value); })
        //     .attr("width", x.rangeBand() * 0.5)
        //     .attr("height", function (d) { return histogramHeight - y(d.value); });

        chart.enter().append("rect")
                     .attr("class", "bar")
                     .attr("x", function (d) { return x(d.name) + x.rangeBand() * 0.25; })
                     .attr("y", function (d) { return histogramHeight; })
                     .attr("width", x.rangeBand() * 0.5)
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
        x = d3.scale.ordinal()
                    .rangeRoundBands([0, histogramWidth], .1)
                    .domain(dataset.data.map(function (d) { return d.name; }));
        
        xAxis = d3.svg.axis()
                      .scale(x)
                      .orient("bottom");
        
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

        histogramContainer.select(".x.axis")
                          .attr("transform", "translate(0," + histogramHeight + ")")
                          .call(xAxis)
                          .selectAll("text")
                          .attr("y", 7)
                          .attr("x", -5)
                          .attr("transform", "rotate(-50)")
                          .style("text-anchor", "end");
        
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
              .style("text-anchor", "end");

        var chart = histogramContainer.selectAll(".bar")
                     .attr("x", function (d) { return x(d.name) + x.rangeBand() * 0.25; })
                     .attr("width", x.rangeBand() * 0.5)
                     .attr("y", function (d) { return y(d.value); })
                     .attr("height", function (d) { return histogramHeight - y(d.value); })

    }

    //-----------------------------------------
    // Helper functions
    //-----------------------------------------

    var capitalizeString = function (str) {
        return str.replace(/(?:^|\s)\S/g, function (a) { return a.toUpperCase(); });
    };
    
    // resize on window resize 
    var resizeTimerHist;
    $(window).resize(function () {
        self.redraw();
    });
}