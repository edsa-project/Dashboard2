/**
 * Advance options functionality:
 * toggle advance options
 * selecting Location Aggregate
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
    $(".additional-options").slideToggle(400);
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

// loads the basic statistics
function loadBasicStats() {
    // load number of jobs
    $.ajax({
        type: "GET",
        url: "http://pankretas.ijs.si:8040/get_number_of_jobs",
        dataType: 'jsonp',
        cache: false,
        success: function (json) {
            $('#infoStatJobPosts').html("<b>" + json.number_of_jobs + "</b>");
        }
    });
    // load number of locations
    $.ajax({
        type: "GET",
        url: "http://pankretas.ijs.si:8040/get_number_of_locations",
        dataType: 'jsonp',
        cache: false,
        success: function (json) {
            $('#infoStatLocations').html("<b>" + json.number_of_locations + "</b>");
        }
    });
    // load number of skills
    $.ajax({
        type: "GET",
        url: "http://pankretas.ijs.si:8040/get_number_of_skills",
        dataType: 'jsonp',
        cache: false,
        success: function (json) {
            $('#infoStatSkills').html("<b>" + json.number_of_skills + "</b>");
        }
    });
}


/**
 * The common search options function. It queries the data for
 * the specific dashbard.
 * @param {string} dashbaordType - The name of the dashboard.
 */ 
function searchOptions(dashboardType) {
    console.log("search function");
    // get skill and location query
    var querySkills = $("#skill-search").val();
    var queryLocation = $("#location-search").val();
    
    var parentCountries = ["United Kingdom", "France"];
    
    var findQuery = 'QUERY';
    
    var skillsArray = [];
    var locationArray = [];
    if (querySkills) { skillsArray = querySkills.split(','); }
    if (queryLocation) { locationArray = queryLocation.split(','); }
    
    if (skillsArray.length == 0 && locationArray.length == 0) {
        return;
    }

    // prepare the query string
    var queryString = '';
    
    // prepare query for skills	    
    if (skillsArray.length > 0) {
        findQuery += ' [skills:';
        var lastSkillIdx = skillsArray.length - 1;
        for (var SkillIdx = 0; SkillIdx < lastSkillIdx ; SkillIdx++) {
            queryString += 'q=' + skillsArray[SkillIdx] + '&';
            findQuery += skillsArray[SkillIdx] + ',';
        }
        queryString += 'q=' + skillsArray[lastSkillIdx];
        findQuery += skillsArray[lastSkillIdx] + ']';
        
        // if we query the locations
        if (locationArray.length > 0) {
            queryString += '&';
        }
    }
    // prepare query for locations
    if (locationArray.length > 0) {
        findQuery += ' [locations:';
        var lastLocIdx = locationArray.length - 1;
        for (var LocIdx = 0; LocIdx < lastLocIdx ; LocIdx++) {
            queryString += 'l=' + locationArray[LocIdx] + '&';
            findQuery += locationArray[LocIdx] + ',';
        }
        queryString += 'l=' + locationArray[lastLocIdx];
        findQuery += locationArray[lastLocIdx] + ']';

    }
    
    if ((skillsArray.length > 0) || (locationArray.length > 0)) {
        document.getElementById("query-container").innerHTML = '<h4 class= \"boundbox\">' + findQuery + '</h3>';
    }
    
    // start the page-loader
    $("#map-load-container").addClass("loading");

    // query the data
    if (skillsArray.length > 0) {
        $.ajax({
            type: "GET",
            url: "http://pankretas.ijs.si:8040/search_jobs_by_skill_and_location?" + queryString,
            data: queryString,
            dataType: 'jsonp',
            cache: false,
            success: function (json) {
                searchSuccess(json);
            }
        });
        
        
        // for Job Seekers, query the lectures 
        if (dashboardType == "Job Seekers") {
            //fill suggested materials table
            var find = '_';
            var re = new RegExp(find, 'g');
            var dataStringSuggested = encodeURI(dataString.replace(re, ''));
            
            $.ajax({
                type: "GET",
                url: "http://pankretas.ijs.si:8042/search_lectures_by_keyword?" + dataStringSuggested,
                data: dataString,
                dataType: 'jsonp',
                cache: false,
                success: function (json) {
                    
                    var un_json = JSON.parse(unescape(json.lec_result));
                    console.log("search videolectures:" + un_json.length);
                    var sLimit = 100;
                    if (un_json.length < sLimit)
                        sLimit = un_json.length;
                    
                    var dataSet = [];
                    for (var s = 0; s < sLimit; s++) {
                        var lecture = un_json[s];
                        
                        var lecinfo = [];
                        lecinfo[0] = lecture.lectureTitle;
                        lecinfo[1] = lecture.lectureDesc;
                        lecinfo[2] = "<a href=\"http://videolectures.net/" + lecture.url + "\">" + lecture.url + "</a>";
                        lecinfo[3] = lecture.recorded;
                        
                        dataSet[s] = lecinfo;
                    }
                    
                    var osuggestedtable = $('#suggestedMaterials').DataTable();
                    osuggestedtable.destroy();
                    
                    $('#suggestedMaterials').DataTable({
                        /*scrollY:        "300px",
                         scrollCollapse: true,
                         paging:         false,
                         */
                         data: dataSet,
                        columns: [
                            { title: "Lecture Title" },                            
                            { title: "Lecture Description" },
                            { title: "Lecture Url" },
                            { title: "Date" }
                        ],
                        pageLength: 2,
                        autoWidth: false
                    });
                }
            });
        }
    }
    
    else if ((locationArray.length > 0) && (parentCountries.indexOf(locationArray[0]) > -1)) {
        $.ajax({
            type: "GET",
            url: "http://pankretas.ijs.si:8040/search_jobs_by_parent_country?" + "q=" + locationArray[0],
            dataType: 'jsonp',
            cache: false,
            success: function (json) {
                searchSuccess(json);
            }
        });

    }

    else if (locationArray.length > 0) {
        $.ajax({
            type: "GET",
            url: "http://pankretas.ijs.si:8040/search_jobs_by_location_name?" + queryString,
            data: queryString,
            dataType: 'jsonp',
            cache: false,
            success: function (json) {
                searchSuccess(json);
            }
        });
    }
}