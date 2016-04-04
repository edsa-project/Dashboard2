/**
 * Advance options functionality:
 * - toggle advance options
 * - selecting Location Aggregate
 */ 

 // toggles the visibility of the advance search container
function toggleAdvOptions() {
    var button = $("#showOptions");
    // change the options button 
    if (button.attr("data-value") == "right") {
        button.removeClass("glyphicon-chevron-right")
              .addClass("glyphicon-chevron-down");
        button.attr("data-value", "down");
    } else if (button.attr("data-value") == "down") {
        button.removeClass("glyphicon-chevron-down")
              .addClass("glyphicon-chevron-right");
        button.attr("data-value", "right");
    }
    // toggle the additional options
    $(".additional-options").slideToggle("slow");
    
    // change the size of the info container
    var info_container = $('#info-container');
    if (info_container.height() != 630) {
        info_container.animate({ height: 630 }, 500);
    } else {
        info_container.animate({ height: 740 }, 500);
    }
}

// advance options selection: dropdown menu
$(function () {
    // location selection
    $('#options-location > .dropdown-menu').on('click', 'li a', function () {
        $("#options-location > .dropdown-toggle > .selected-location").text($(this).text());
        $("#options-location > .dropdown-toggle > .selected-location").val($(this).text());
    });
    // time selection
    $('#options-time > .dropdown-menu').on('click', 'li a', function () {
        $("#options-time > .dropdown-toggle > .selected-time").text($(this).text());
        $("#options-time > .dropdown-toggle > .selected-time").val($(this).text());
    })
});



/**
 * Creates the Europe map object and draws the map.
 */ 
var europe = new EuropeMap({
    mapContainer: "#map-container",
    multipleSelection: false
});
europe.DrawMap();