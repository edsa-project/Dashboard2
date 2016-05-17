/**
 * Creates the Europe map and and draws the map.
 */ 

// create the map and draw's it
var europe = new EuropeMap({
    mapContainer: "#map-container",
    timelineContainer: "#timeline-container",
    infoContainer: "#info-container"
});
europe.DrawMap();

// set the resize functionality
var resizeTimerMap;
$(window).resize(function () {
    clearTimeout(resizeTimerMap);
    resizeTimerMap = setTimeout(function () {
        europe.redraw();
    }, 400);
   
})