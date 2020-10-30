(function ($) {
  /***
   * A sample AJAX data store implementation.
   * Right now, it's hooked up to load Hackernews stories, but can
   * easily be extended to support any JSONP-compatible backend that accepts paging parameters.
   */
  function AjaxModel(url, pagesize, request_extra) {
    // private
    var PAGESIZE = (pagesize? pagesize: 100);
    //var data = {length: 0};
    var data = [];
    var data_length = 0;
    var searchstr = {};
    var sortcol = null;
    var sortdir = 1;
    var h_request = null;
    var req = null; // ajax request

    // events
    var onDataLoading = new Slick.Event();
    var onDataLoaded = new Slick.Event();


    function init() {
    }


    function isDataLoaded(from, to) {
      for (var i = from; i <= to; i++) {
        if (data[i] == undefined || data[i] == null) {
          return false;
        }
      }

      return true;
    }


    function clear() {
      /*
      for (var key in data) {
        delete data[key];
      }
      */
      for (var n = 0; n < data.length; n++) {
        delete data[n];
      }
      data.length = 0;
    }


    function ensureData(from, to) {
      if (req) {
        req.abort();
        for (var i = req.fromPage; i <= req.toPage; i++)
          data[i * PAGESIZE] = undefined;
      }

      if (from < 0) {
        from = 0;
      }

      if (data_length > 0) {
        to = Math.min(to, data_length - 1);
      }

      var fromPage = Math.floor(from / PAGESIZE);
      var toPage = Math.floor(to / PAGESIZE);

      while (data[fromPage * PAGESIZE] !== undefined && fromPage < toPage)
        fromPage++;

      while (data[toPage * PAGESIZE] !== undefined && fromPage < toPage)
        toPage--;

      if (fromPage > toPage || ((fromPage == toPage) && data[fromPage * PAGESIZE] !== undefined)) {
        // TODO:  look-ahead
        onDataLoaded.notify({from: from, to: to});
        return;
      }

      var request_data = { 
        'q': searchstr,
        'start': (fromPage * PAGESIZE),
        'limit': (((toPage - fromPage) * PAGESIZE) + PAGESIZE),
      };

      var request = Object.assign({}, request_data, request_extra);

      if (sortcol != null) {
          request['sort'] =  sortcol;
          request['dir'] = ((sortdir > 0) ? "desc" : "asc");
      }

      if (h_request != null) {
        clearTimeout(h_request);
      }

      h_request = setTimeout(function () {

        onDataLoading.notify({from: from, to: to});

        req = $.ajax({
          dataType: "json",
          url: url,
          type: 'POST',
          data: request,
          callbackParameter: "callback",
          cache: true,
          success: onSuccess,
          error: function (xhr) {
            onError(xhr, fromPage, toPage)
          }
        });
        req.fromPage = fromPage;
        req.toPage = toPage;
      }, 50);
    }


    function onError(xhr, fromPage, toPage) {
      // abort means we are scrolling too fast (due to timeout on scroll event)
      if ('abort' != xhr.statusText) {
        alert("error loading pages " + fromPage + " to " + toPage);
      }
    }

    function onSuccess(resp) {
      var from = resp.request.start, to = from + resp.results.length;
      // data.length = Math.min(parseInt(resp.hits), 1000); // limitation of the API
      data.length = resp.hits;
      // data_length = resp.hits;  // CHANGE TO THIS IF plan for more than 30K records

      for (var i = 0; i < resp.results.length; i++) {

        var item = resp.results[i];

        idx = parseInt(from) + i;
        
        var d = (data[idx] = {});
        d["id"] = idx;

        for (var key in item) {
          d[key] = item[key];
        }
      }

      req = null;

      onDataLoaded.notify({from: from, to: to});
    }


    function reloadData(from, to) {
      for (var i = from; i <= to; i++)
        delete data[i];

      ensureData(from, to);
    }


    function setSort(column, dir) {
      sortcol = column;
      sortdir = dir;
      clear();
      // onDataLoaded.notify({from: 0, to: data_length});
    }

    function setSearch(hash) {
      searchstr = hash;
      clear();
    }


    init();

    return {
      // properties
      "data": data,

      // methods
      "clear": clear,
      "isDataLoaded": isDataLoaded,
      "ensureData": ensureData,
      "reloadData": reloadData,
      "setSort": setSort,
      "setSearch": setSearch,

      // events
      "onDataLoading": onDataLoading,
      "onDataLoaded": onDataLoaded
    };
  }

  // Slick.Data.RemoteModel
  $.extend(true, window, { Slick: { Data: { AjaxModel: AjaxModel }}});
})(jQuery);
