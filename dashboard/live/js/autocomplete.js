/**
 * Functionality for the autocomplete search.
 * 
 * Uses typeahead.js: https://twitter.github.io/typeahead.js/
 * and Bootstrap Tags Input: http://bootstrap-tagsinput.github.io/bootstrap-tagsinput/examples/
 */ 

function LoadAutocomplete() {
    /**
     * Get all skills from the database and create a bootstrap
     * tags input autocomplete.
     */ 
    $.ajax({
        type: "GET",
        url: "http://pankretas.ijs.si:8040/get_all_skills",
        dataType: 'jsonp',
        cache: false,
        success: function (json) {
            var skillset = json.skills;
            // skills typeahead and tags 
            var skills = new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                local: $.map(skillset, function (skill) { return { name: skill.value }; })
            }); skills.initialize();
            
            $("#skill-search").tagsinput({
                itemValue: "name",
                typeaheadjs: {
                    name: "skills",
                    displayKey: 'name',
                    source: skills.ttAdapter()
                }
            });
        }
    });
    
    /**
     * Get all locations from the database and create a bootstrap
     * tags input autocomplete.
     */
    $.ajax({
        type: "GET",
        url: "http://pankretas.ijs.si:8040/get_all_locations",
        dataType: 'jsonp',
        cache: false,
        success: function (json) {
            var locationset = json.locations;
            // locations typeahead and tags 
            var locations = new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                local: $.map(locationset, function (location) { return { name: location.value }; })
            }); locations.initialize();
            
            $("#location-search").tagsinput({
                itemValue: "name",
                typeaheadjs: {
                    name: "locations",
                    displayKey: 'name',
                    source: locations.ttAdapter()
                }
            });
        }
    });
}