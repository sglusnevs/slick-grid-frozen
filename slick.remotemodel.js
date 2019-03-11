(function ($) {
  /***
   * A sample AJAX data store implementation.
   * Right now, it's hooked up to load Hackernews stories, but can
   * easily be extended to support any JSONP-compatible backend that accepts paging parameters.
   */
  function RemoteModel(url, pagesize, stoken) {
    // private
    var PAGESIZE = pagesize;
    // var data = {length: 0};
    var data = [];
    var dataOrig = [];
    var filter = null;
    var searchstr = "";
    var sortcol = null;
    var sortdir = 1;
    var h_request = null;
    var req = null; // ajax request

    // events
    var onDataLoading = new Slick.Event();
    var onDataLoaded = new Slick.Event();


    function init() {
      // console.log('Remote model initialized: ' + url);
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
      for (var key in data) {
        delete data[key];
      }
      data.length = 0;
    }

    function setFilter(filterFn) {
      filter = filterFn;
    }


    function filterView() {

      clear();

      idx = 0;
      for (var i in dataOrig) {
        item = dataOrig[i];
        if (filter(dataOrig[i])) {
          data[idx++] = dataOrig[i];
        }
      }


      onDataLoaded.notify({from:0, to: data.length});
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

      if (data.length > 0) {
        to = Math.min(to, data.length - 1);
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

      var request = { 
        'q': searchstr,
        'stoken': stoken,
      };

      if (sortcol != null) {
          request['sort'] =  sortcol;
          request['dir'] = ((sortdir > 0) ? "asc" : "desc");
      }

      if (h_request != null) {
        clearTimeout(h_request);
      }

      h_request = setTimeout(function () {
        for (var i = fromPage; i <= toPage; i++)
          data[i * PAGESIZE] = null; // null indicates a 'requested but not available yet'

        onDataLoading.notify({from: from, to: to});

        req = $.ajax({
          dataType: "json",
          url: url,
          type: 'POST',
          data: request,
          callbackParameter: "callback",
          cache: true,
          success: onSuccess,
          error: function () {
            onError(fromPage, toPage)
          }
        });
        req.fromPage = fromPage;
        req.toPage = toPage;
      }, 50);
    }

    function addRowsLocal(rows) {

      var from = data.length, to = from + rows.length;

      for (var i = 0; i < rows.length; i++) {
        var item = rows[i];

        idx = from + i;

        var d = (data[idx] = {});
        var k = (dataOrig[idx] = {});
        d["id"] = idx;
        k["id"] = idx;

        for (var key in item) {
          d[key] = item[key];
          k[key] = item[key];
        }
      }

      onDataLoaded.notify({from: from, to: to});
    }

    function getData() {

      return data;
    }

    function deleteRowLocalById(id, key) {

      var from = 0, to = data.length;

      for (var i = to-1; i >= from; i--) {

        if (data[i][key] == id) {
          data.splice(i, 1);
          dataOrig.splice(i, 1);
          from = i;
          break;
        }
      }

      onDataLoaded.notify({from: from, to: to});
    }

    function deleteRowLocalByIdx(idx) {
      data.splice(idx, 1);
      dataOrig.splice(idx, 1);
      onDataLoaded.notify({from: idx, to: idx});
    }


    function onError(fromPage, toPage) {
      alert("error loading pages " + fromPage + " to " + toPage);
    }

    function onSuccess(resp) {

      var numRows = resp.text.length;

      if ('error' == resp.status) {
        numRows = 0;
      }

      var from = 0, to = from + numRows;

      for (var i = 0; i < numRows; i++) {
        var item = resp.text[i];

        // Old IE versions can't parse ISO dates, so change to universally-supported format.
        // item.create_ts = item.create_ts.replace(/^(\d+)-(\d+)-(\d+)T(\d+:\d+:\d+)Z$/, "$2/$3/$1 $4 UTC"); 
        // item.create_ts = new Date(item.create_ts);


        var d = (data[i] = {});
        var k = (dataOrig[i] = {});
        d["id"] = i;
        k["id"] = i;

        for (var key in item) {
          d[key] = item[key];
          k[key] = item[key];
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
    }

    function setSearch(str) {
      searchstr = str;
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
      "setFilter": setFilter,
      "filterView": filterView,
      "addRowsLocal": addRowsLocal,
      "deleteRowLocalById": deleteRowLocalById,
      "deleteRowLocalByIdx": deleteRowLocalByIdx,
      "getData": getData,

      // events
      "onDataLoading": onDataLoading,
      "onDataLoaded": onDataLoaded
    };
  }

  // Slick.Data.RemoteModel
  $.extend(true, window, { Slick: { Data: { RemoteModel: RemoteModel }}});
})(jQuery);
