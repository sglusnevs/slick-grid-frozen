/***
 * Contains basic SlickGrid editors.
 * @module Editors
 * @namespace Slick
 */

(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "Editors": {
        "Auto": AutoCompleteEditor,
        "Text": TextEditor,
        "Integer": IntegerEditor,
        "Date": DateEditor,
        "YesNoSelect": YesNoSelectEditor,
        "Checkbox": CheckboxEditor,
        "PercentComplete": PercentCompleteEditor,
        "LongText": LongTextEditor,
        "JSONViewer": JSONViewer,
        "JSONEditor": JSONEditor,
        "JSONEditorActionEdit": null,
      }
    }
  });

  function AutoCompleteEditor(args) {
     var leftP,topP;
     var $input;
     var $tag;
     var defaultValue;
     var scope = this;
     var calendarOpen = false;
     var constrained;

     this.init = function () {

       this.constrained = args.column.constrained;

       $input = $("<INPUT id='tags' class='editor-text' />");

       $input.width($(args.container).innerWidth() - 25);

       $input.appendTo(args.container);

       $tag = $("<INPUT type='hidden' />");

       $tag.appendTo(args.container);


       $input.bind("keydown.nav", function(e) {

          // don't navigate away from the field on tab when selecting an item

          if ((e.keyCode == $.ui.keyCode.DOWN || e.keyCode == $.ui.keyCode.UP) && $('ul.ui-autocomplete').is(':visible')) {

            e.stopPropagation();
          }


          if (e.keyCode == $.ui.keyCode.LEFT || e.keyCode == $.ui.keyCode.RIGHT || e.keyCode == $.ui.keyCode.TAB) {

            e.stopPropagation();
          }


          if (e.keyCode == $.ui.keyCode.DOWN && !$('ul.ui-autocomplete').is(':visible')) {

            e.stopPropagation();

            // pass empty string as value to search for, displaying all results
            $input.autocomplete( "search", "" );

            //This is to get the current cell's position and open the autocomplete menu accordingly.
            $("ul.ui-autocomplete.ui-menu") 
                .css("top", topP + 27)
                .css("left", leftP)
                .css("width", $input.width() + 26); 

            $input.focus().select();
          }

          //if (e.keyCode == $.ui.keyCode.ENTER && $('ul.ui-autocomplete').is(':visible')) {
          //  $input.autocomplete( "close" );
          //}
       });


       $("<a>")
            .attr( "tabIndex", -1 )
            .attr( "title", "Show All Items" )
            .appendTo( args.container )
            .css( "zIndex", 1 )
            .css( "min-width", 25 )
            .html('<span class="ui-icon ui-icon-triangle-1-s" style="margin: 4px 0 0 5px">')
            .removeClass( "ui-corner-all" )
            .addClass( "ui-combobox-toggle" )
            .click(function() {

                // close if already visible
                if ( $input.autocomplete( "widget" ).is( ":visible" ) ) {
                    $input.autocomplete( "close" );
                    return;
                }

                // work around a bug (likely same cause as #5265)
                // $(this).blur();

                // pass empty string as value to search for, displaying all results
                $input.autocomplete( "search", "" );

                //This is to get the current cell's position and open the autocomplete menu accordingly.
                $("ul.ui-autocomplete.ui-menu") 
                    .css("top", topP + 25)
                    .css("left", leftP + 1)
                    .css("width", $input.width() + 27); 

                $input.focus().select();

            });

       //$input.focus().select();

       var autoParams = {
            delay: 0,
            minLength: 0,
            source: args.column.comboValues,
            focus: function( event, ui ) {
              //$input.val( ui.item.label );
              // return false;
            },
            change: function( event, ui ){

              if (args.column.constrainExisting) {
                $(this).val((ui.item ? ui.item.id : ""));
              }

              var label = '', value = '';

              if (ui.item) {
                value = ui.item.value;
                label = ui.item.label;
              }

              args.grid.onCellChangeCustom.notify({ 
                'id': args.column.id, 
                'field': args.column.field, 
                'label': label, 
                'value': value 
              });

            },
            select: function( event, ui ) {

              var label = '', value = '';

              value = ui.item.value;
              label = ui.item.label;
              $tag.val(value);
              $input.val(label);
              $input.autocomplete( "close" );
              args.commitChanges();

              args.grid.onCellChangeCustom.notify({ 
                'id': args.column.id, 
                'field': args.column.field, 
                'label': label, 
                'value': value 
              });

              return false;
            },
        };

       if (typeof args.column.comboValues === 'string' && args.column.comboValues.match(/^https?:\/\//i)) {
         autoParams['dataType'] = 'json';
       }

       $input.autocomplete(autoParams).keyup(function (e) {
            if (e.which === 13) {
              $(".ui-autocomplete").hide();
              $input.autocomplete( "close" );
            }            
        });

     };


     this.destroy = function () {
       $input.autocomplete("destroy");
     };

     this.focus = function () {
       $input.focus();
     };

     this.show = function () {
       //
     };

     this.loadValue = function (item) {

      value = item[args.column.field];

      //$(".mwsGridLogPanel").prepend('<div>' + value + '</div>');

      $tag.val(value);


      if (!value) {

        defaultValue = '';

      } else if (-1 === value.indexOf('|')) {

        defaultValue = value;

      } else {

        var tail = value.split('|'); 
        
        tail.shift();
        
        defaultValue = tail.join();
      }

       //defaultValue = item[args.column.field];
       //alert(defaultValue);
       $input.val(defaultValue);
       //$input[0].defaultValue = defaultValue;
       $input.select();
     };

     this.serializeValue = function () {
       //if (this.constrained && 'undefined' != $tag.val()) return $tag.val(); else return $input.val();
       if (!this.constrained) $tag.val($input.val());
       return $tag.val(); // return hidden value instead of real visible
       // return $input.val();
     };

     this.applyValue = function (item, state) {
       item[args.column.field] = state;
     };

     this.isValueChanged = function () {
       //if ('' === $input.val()) $input.val('&nbsp;');
       return (!($input.val() == "" && defaultValue == null)) || ($input.val() != defaultValue); // workaround to avoid "undefined" on double-pressing enter key
       // return (!($input.val() == "" && defaultValue == null)) && ($input.val() != defaultValue);
     };

     this.validate = function () {

       return {
         valid: true,
         msg: null
       };
     };

     this.position = function (position) {

         leftP = position.left;
         topP = position.top;

         /*
         $(".ui-autocomplete").position({
            my: "left top",
            at: "left bottom",
            of: $("#tags"),
            collision: "flip flip"
         }); 
         */

                $("ul.ui-autocomplete.ui-menu") 
                    .css("top", topP + 27)
                    .css("left", leftP)
                    .css("width", $('#tags').width() + 26); 
      };

     this.init();
   }

  function TextEditor(args) {
    var $input;
    var defaultValue;
    var scope = this;

    this.init = function () {
      $input = $("<INPUT type=text class='editor-text' />")
          .appendTo(args.container)
          .bind("keydown.nav", function (e) {
            if (e.keyCode === $.ui.keyCode.LEFT || e.keyCode === $.ui.keyCode.RIGHT) {
              e.stopImmediatePropagation();
            }
          })
          .focus()
          .select();
    };

    this.destroy = function () {
      $input.remove();
    };

    this.focus = function () {
      $input.focus();
    };

    this.getValue = function () {
      return $input.val();
    };

    this.setValue = function (val) {
      $input.val(val);
    };

    this.loadValue = function (item) {
      defaultValue = item[args.column.field] || "";
      $input.val(defaultValue);
      $input[0].defaultValue = defaultValue;
      $input.select();
    };

    this.serializeValue = function () {
      return $input.val();
    };

    this.applyValue = function (item, state) {
      item[args.column.field] = state;
    };

    this.isValueChanged = function () {
      return (!($input.val() == "" && defaultValue == null)) && ($input.val() != defaultValue);
    };

    this.validate = function () {
      if (args.column.validator) {
        var validationResults = args.column.validator($input.val());
        if (!validationResults.valid) {
          return validationResults;
        }
      }

      return {
        valid: true,
        msg: null
      };
    };

    this.init();
  }

  function IntegerEditor(args) {
    var $input;
    var defaultValue;
    var scope = this;

    this.init = function () {
      $input = $("<INPUT type=text class='editor-text' />");

      $input.bind("keydown.nav", function (e) {
        if (e.keyCode === $.ui.keyCode.LEFT || e.keyCode === $.ui.keyCode.RIGHT) {
          e.stopImmediatePropagation();
        }
      });

      $input.appendTo(args.container);
      $input.focus().select();
    };

    this.destroy = function () {
      $input.remove();
    };

    this.focus = function () {
      $input.focus();
    };

    this.loadValue = function (item) {
      defaultValue = item[args.column.field];
      $input.val(defaultValue);
      $input[0].defaultValue = defaultValue;
      $input.select();
    };

    this.serializeValue = function () {
      return parseInt($input.val(), 10) || 0;
    };

    this.applyValue = function (item, state) {
      item[args.column.field] = state;
    };

    this.isValueChanged = function () {
      return (!($input.val() == "" && defaultValue == null)) && ($input.val() != defaultValue);
    };

    this.validate = function () {
      if (isNaN($input.val())) {
        return {
          valid: false,
          msg: "Please enter a valid integer"
        };
      }

      return {
        valid: true,
        msg: null
      };
    };

    this.init();
  }

  function DateEditor(args) {
    var $input;
    var defaultValue;
    var scope = this;
    var calendarOpen = false;

    this.init = function () {
      $input = $("<INPUT type=text class='editor-text' />");
      $input.appendTo(args.container);
      $input.focus().select();
      $input.datepicker({
        showOn: "button",
        buttonImageOnly: true,
        buttonImage: "../images/calendar.gif",
        beforeShow: function () {
          calendarOpen = true
        },
        onClose: function () {
          calendarOpen = false
        }
      });
      $input.width($input.width() - 18);
    };

    this.destroy = function () {
      $.datepicker.dpDiv.stop(true, true);
      $input.datepicker("hide");
      $input.datepicker("destroy");
      $input.remove();
    };

    this.show = function () {
      if (calendarOpen) {
        $.datepicker.dpDiv.stop(true, true).show();
      }
    };

    this.hide = function () {
      if (calendarOpen) {
        $.datepicker.dpDiv.stop(true, true).hide();
      }
    };

    this.position = function (position) {
      if (!calendarOpen) {
        return;
      }
      $.datepicker.dpDiv
          .css("top", position.top + 30)
          .css("left", position.left);
    };

    this.focus = function () {
      $input.focus();
    };

    this.loadValue = function (item) {
      defaultValue = item[args.column.field];
      $input.val(defaultValue);
      $input[0].defaultValue = defaultValue;
      $input.select();
    };

    this.serializeValue = function () {
      return $input.val();
    };

    this.applyValue = function (item, state) {
      item[args.column.field] = state;
    };

    this.isValueChanged = function () {
      return (!($input.val() == "" && defaultValue == null)) && ($input.val() != defaultValue);
    };

    this.validate = function () {
      return {
        valid: true,
        msg: null
      };
    };

    this.init();
  }

  function YesNoSelectEditor(args) {
    var $select;
    var defaultValue;
    var scope = this;

    this.init = function () {
      $select = $("<SELECT tabIndex='0' class='editor-yesno'><OPTION value='yes'>Yes</OPTION><OPTION value='no'>No</OPTION></SELECT>");
      $select.appendTo(args.container);
      $select.focus();
    };

    this.destroy = function () {
      $select.remove();
    };

    this.focus = function () {
      $select.focus();
    };

    this.loadValue = function (item) {
      $select.val((defaultValue = item[args.column.field]) ? "yes" : "no");
      $select.select();
    };

    this.serializeValue = function () {
      return ($select.val() == "yes");
    };

    this.applyValue = function (item, state) {
      item[args.column.field] = state;
    };

    this.isValueChanged = function () {
      return ($select.val() != defaultValue);
    };

    this.validate = function () {
      return {
        valid: true,
        msg: null
      };
    };

    this.init();
  }

  function CheckboxEditor(args) {
    var $select;
    var defaultValue;
    var scope = this;

    this.init = function () {
      $select = $("<INPUT type=checkbox value='true' class='editor-checkbox' hideFocus>");
      $select.appendTo(args.container);
      $select.focus();
    };

    this.destroy = function () {
      $select.remove();
    };

    this.focus = function () {
      $select.focus();
    };

    this.loadValue = function (item) {
      defaultValue = !!item[args.column.field];
      if (defaultValue) {
        $select.prop('checked', true);
      } else {
        $select.prop('checked', false);
      }
    };

    this.serializeValue = function () {
      return $select.prop('checked');
    };

    this.applyValue = function (item, state) {
      item[args.column.field] = state;
    };

    this.isValueChanged = function () {
      return (this.serializeValue() !== defaultValue);
    };

    this.validate = function () {
      return {
        valid: true,
        msg: null
      };
    };

    this.init();
  }

  function PercentCompleteEditor(args) {
    var $input, $picker;
    var defaultValue;
    var scope = this;

    this.init = function () {
      $input = $("<INPUT type=text class='editor-percentcomplete' />");
      $input.width($(args.container).innerWidth() - 25);
      $input.appendTo(args.container);

      $picker = $("<div class='editor-percentcomplete-picker' />").appendTo(args.container);
      $picker.append("<div class='editor-percentcomplete-helper'><div class='editor-percentcomplete-wrapper'><div class='editor-percentcomplete-slider' /><div class='editor-percentcomplete-buttons' /></div></div>");

      $picker.find(".editor-percentcomplete-buttons").append("<button val=0>Not started</button><br/><button val=50>In Progress</button><br/><button val=100>Complete</button>");

      $input.focus().select();

      $picker.find(".editor-percentcomplete-slider").slider({
        orientation: "vertical",
        range: "min",
        value: defaultValue,
        slide: function (event, ui) {
          $input.val(ui.value)
        }
      });

      $picker.find(".editor-percentcomplete-buttons button").bind("click", function (e) {
        $input.val($(this).attr("val"));
        $picker.find(".editor-percentcomplete-slider").slider("value", $(this).attr("val"));
      })
    };

    this.destroy = function () {
      $input.remove();
      $picker.remove();
    };

    this.focus = function () {
      $input.focus();
    };

    this.loadValue = function (item) {
      $input.val(defaultValue = item[args.column.field]);
      $input.select();
    };

    this.serializeValue = function () {
      return parseInt($input.val(), 10) || 0;
    };

    this.applyValue = function (item, state) {
      item[args.column.field] = state;
    };

    this.isValueChanged = function () {
      return (!($input.val() == "" && defaultValue == null)) && ((parseInt($input.val(), 10) || 0) != defaultValue);
    };

    this.validate = function () {
      if (isNaN(parseInt($input.val(), 10))) {
        return {
          valid: false,
          msg: "Please enter a valid positive number"
        };
      }

      return {
        valid: true,
        msg: null
      };
    };

    this.init();
  }

  /*
   * Read-only JSON data viever
   * The UI is added onto document BODY and .position(), .show() and .hide() are implemented.
   * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
   */
  function JSONViewer(args) {
    var $input, $wrapper;
    var defaultValue;
    var scope = this;

    this.init = function () {
      var $container = $("body");

      $wrapper = $("<DIV style='z-index:10000; position:absolute; background:white;padding:1px; border:1px solid gray;'/>")
          .appendTo($container);

      $input = $("<TEXTAREA hidefocus rows=5 style='backround:white;width:" + (args.column.width - 12) + "px;min-width:" + (args.column.width - 1) + "px;height:150px;border:0;outline:0;font-size:12px'>")
          .appendTo($wrapper);

      $input.bind("keydown", this.handleKeyDown);

      // this is a trick to close editor within modal dialog,
      // that intercepts Esc key causing editor hanging after it is closed
      $('.modal').bind("keydown", this.handleEsc);

      scope.position(args.position);
      $input.focus().select();

      $input.on('blur', function (e) {
        scope.cancel();
      });
    };

    this.handleEsc = function (e) {
      if (e.which == $.ui.keyCode.ESCAPE) {
        e.preventDefault();
        scope.cancel();
      }
    };

    this.handleKeyDown = function (e) {
      if (e.which == $.ui.keyCode.ENTER && e.ctrlKey) {
        scope.save();
      } else if (e.which == $.ui.keyCode.ESCAPE) {
        e.preventDefault();
        scope.cancel();
      } else if (e.which == $.ui.keyCode.TAB && e.shiftKey) {
        e.preventDefault();
        args.grid.navigatePrev();
      } else if (e.which == $.ui.keyCode.TAB) {
        e.preventDefault();
        args.grid.navigateNext();
      }
    };

    this.save = function () {
      args.commitChanges();
    };

    this.cancel = function () {
      $input.val(defaultValue);
      args.cancelChanges();
    };

    this.hide = function () {
      $wrapper.hide();
    };

    this.show = function () {
      $wrapper.show();
    };

    this.position = function (position) {
      $wrapper
          .css("top", position.top - 0)
          .css("left", position.left - 0)
    };

    this.destroy = function () {
      $wrapper.remove();
    };

    this.focus = function () {
      $input.focus();
    };


    this.jsonParse = function (str) {
      res = str;
      try {
          res = JSON.stringify(JSON.parse(str.replace(/=>/g,':')), null, 2).replace(/"\s*:\s*(["{[0-9])/g, '" => $1');
      } catch (e) {
          res = str;
      }
      return res;
    }

    this.loadValue = function (item) {

      var defaultValue = item[args.column.field];

      $input.val(this.jsonParse(item[args.column.field]));
      /*
      $input.select();
      $input.focus();
      */

      //
      /*
      defaultValue = item[args.column.field] || "";
      $input.val(defaultValue);
      $input[0].defaultValue = defaultValue;
      $input.select();
      */
    };

    this.serializeValue = function () {
      return $input.val();
    };

    this.applyValue = function (item, state) {
      item[args.column.field] = state;
    };

    this.isValueChanged = function () {
      return (!($input.val() == "" && defaultValue == null)) && ($input.val() != defaultValue);
    };

    this.validate = function () {
      return {
        valid: true,
        msg: null
      };
    };

    this.init();
  }

  /*
   * Extended JSON Viewer that has two extra buttons -- "Edit" to call external editor
   * and "Cancel" to close the textarea field
   */
  function JSONEditor(args) {
    var $input, $wrapper;
    var defaultValue;
    var scope = this;

    this.init = function () {
      var $container = $("body");


      $wrapper = $("<DIV style='z-index:10000; position:absolute; background:white;padding:1px; border:1px solid gray;'/>")
          .appendTo($container);

      $input = $("<TEXTAREA readonly hidefocus rows=5 style='backround:white;width:" + (args.column.width - 12) + "px;min-width:" + (args.column.width - 1) + "px;height:50px;border:0;outline:0;font-size:12px'>")
          .appendTo($wrapper);

      $("<DIV style='text-align:right'><BUTTON class='btn btn-default btn-minimal btn-small' id='jsoneditor-btn-save' style='padding: 3px'>Edit</BUTTON><BUTTON class='btn btn-default btn-minimal btn-small' style='padding: 3px'>Cancel</BUTTON></DIV>")
          .appendTo($wrapper);

      $wrapper.find("button:first").bind("click", this.save);
      $wrapper.find("button:last").bind("click", this.cancel);
      $input.bind("keydown", this.handleKeyDown);

      scope.position(args.position);
      $input.focus().select();
      
      $input.on('blur', function (e) {
        if (e.relatedTarget && e.relatedTarget.id != 'jsoneditor-btn-save' ) {
          scope.cancel();
        }
      });
    };

    this.handleKeyDown = function (e) {
      if (e.which == $.ui.keyCode.ENTER && e.ctrlKey) {
        scope.save();
      } else if (e.which == $.ui.keyCode.ESCAPE) {
        e.preventDefault();
        scope.cancel();
      } else if (e.which == $.ui.keyCode.TAB && e.shiftKey) {
        e.preventDefault();
        args.grid.navigatePrev();
      } else if (e.which == $.ui.keyCode.TAB) {
        e.preventDefault();
        args.grid.navigateNext();
      }
    };

    this.save = function () {
      args.cancelChanges();
      Slick.Editors.JSONEditorActionEdit(args.item[grid.tag]);
    };

    this.cancel = function () {
      $input.val(defaultValue);
      args.cancelChanges();
    };

    this.hide = function () {
      $wrapper.hide();
    };

    this.show = function () {
      $wrapper.show();
    };

    this.position = function (position) {
      $wrapper
          .css("top", position.top - 0)
          .css("left", position.left - 0)
    };

    this.destroy = function () {
      $wrapper.remove();
    };

    this.focus = function () {
      $input.focus();
    };

    this.jsonParse = function (str) {
      res = str;
      try {
          res = JSON.stringify(JSON.parse(str.replace(/=>/g,':')), null, 2).replace(/"\s*:\s*(["{[0-9])/g, '" => $1');
      } catch (e) {
          res = str;
      }
      return res;
    }

    this.loadValue = function (item) {
      defaultValue = item[args.column.field];
      $input.val(this.jsonParse(item[args.column.field]));
      $input.focus();
    };

    this.serializeValue = function () {
      return $input.val();
    };

    this.applyValue = function (item, state) {
      item[args.column.field] = state;
    };

    this.isValueChanged = function () {
      return (!($input.val() == "" && defaultValue == null)) && ($input.val() != defaultValue);
    };

    this.validate = function () {
      return {
        valid: true,
        msg: null
      };
    };

    this.init();
  }

  /*
   * An example of a "detached" editor.
   * The UI is added onto document BODY and .position(), .show() and .hide() are implemented.
   * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
   */
  function LongTextEditor(args) {
    var $input, $wrapper;
    var defaultValue;
    var scope = this;

    this.init = function () {
      var $container = $("body");

      $wrapper = $("<DIV style='z-index:10000; position:absolute; background:white;padding:1px; border:1px solid gray;'/>")
          .appendTo($container);

      $input = $("<TEXTAREA hidefocus rows=5 style='backround:white;width:" + (args.column.width - 12) + "px;min-width:" + (args.column.width - 1) + "px;height:150px;border:0;outline:0;font-size:12px'>")
          .appendTo($wrapper);

      //$("<DIV style='text-align:right'><BUTTON>Save</BUTTON><BUTTON>Cancel</BUTTON></DIV>")
      //    .appendTo($wrapper);

      $wrapper.find("button:first").bind("click", this.save);
      $wrapper.find("button:last").bind("click", this.cancel);
      $input.bind("keydown", this.handleKeyDown);

      scope.position(args.position);
      $input.focus().select();
    };

    this.handleKeyDown = function (e) {
      if (e.which == $.ui.keyCode.ENTER && e.ctrlKey) {
        scope.save();
      } else if (e.which == $.ui.keyCode.ESCAPE) {
        e.preventDefault();
        scope.cancel();
      } else if (e.which == $.ui.keyCode.TAB && e.shiftKey) {
        e.preventDefault();
        args.grid.navigatePrev();
      } else if (e.which == $.ui.keyCode.TAB) {
        e.preventDefault();
        args.grid.navigateNext();
      }
    };

    this.save = function () {
      args.commitChanges();
    };

    this.cancel = function () {
      $input.val(defaultValue);
      args.cancelChanges();
    };

    this.hide = function () {
      $wrapper.hide();
    };

    this.show = function () {
      $wrapper.show();
    };

    this.position = function (position) {
      $wrapper
          .css("top", position.top - 0)
          .css("left", position.left - 0)
    };

    this.destroy = function () {
      $wrapper.remove();
    };

    this.focus = function () {
      $input.focus();
    };

    this.loadValue = function (item) {
      $input.val(defaultValue = item[args.column.field]);
      $input.select();
    };

    this.serializeValue = function () {
      return $input.val();
    };

    this.applyValue = function (item, state) {
      item[args.column.field] = state;
    };

    this.isValueChanged = function () {
      return (!($input.val() == "" && defaultValue == null)) && ($input.val() != defaultValue);
    };

    this.validate = function () {
      return {
        valid: true,
        msg: null
      };
    };

    this.init();
  }
})(jQuery);
