/********************************************************
 * This file contains the functions, that are called 
 * before or after the document is ready.
 */ 


//-------------------------------------------------------
// When the document is ready
//-------------------------------------------------------

// manipulates the dom
$(window).bind('dom-manipulation', function () {
    // set the width of the load animation container
    $("#map-load-container").css("width", $(".map").width());
    // set the autocomplete functions
    LoadAutocomplete();
    loadBasicStats();
});


$(document).ready(function () {
    $(window).trigger('dom-manipulation');
});