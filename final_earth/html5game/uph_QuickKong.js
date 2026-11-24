(function()
{
    var kongAPI, hasKongNow = false;

    function loadJS(filename, then) {
        var scriptelem = document.createElement('script');
        scriptelem.setAttribute("src", filename);
        document.getElementsByTagName('head')[0].appendChild(scriptelem);
        scriptelem.onload = then;
    };

    window.doInitKong = function() {
        loadJS("https://cdn1.kongregate.com/javascripts/kongregate_api.js", function() {
            kongregateAPI.loadAPI(function() {
                kongAPI = kongregateAPI.getAPI();
                hasKongNow = true;
                console.log("Kongregate API now available!");
            });
        });
    };

    window.setStat = function(stat, number) {
        if (! hasKongNow) return;

        if (! kongAPI.services.isGuest()) {
            kongAPI.stats.submit(stat, number);
            console.log("Submitting " + stat + " as " + number + ".");
        }
    };
})();