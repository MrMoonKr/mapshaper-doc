/* @requires mapshaper-elements, mapshaper-mode-button */

var SimplifyControl = function(model) {
  var control = new EventDispatcher();
  var _value = 1;
  var el = El('#g-simplify-control-wrapper');
  var menu = El('#simplify-options');

  new SimpleButton('#simplify-options .submit-btn').on('click', onSubmit);
  new SimpleButton('#simplify-options .cancel-btn').on('click', model.clearMode);

  new ModeButton('#simplify-btn', 'simplify', model);
  model.addMode('simplify', turnOn, turnOff);


  var slider = new Slider("#g-simplify-control .g-slider");
  slider.handle("#g-simplify-control .g-handle");
  slider.track("#g-simplify-control .g-track");
  slider.on('change', function(e) {
    var pct = fromSliderPct(e.pct);
    text.value(pct);
    onchange(pct);
  });
  slider.on('start', function(e) {
    control.dispatchEvent('simplify-start');
  }).on('end', function(e) {
    control.dispatchEvent('simplify-end');
  });

  var text = new ClickText("#g-simplify-control .g-clicktext");
  text.bounds(0, 1);
  text.formatter(function(val) {
    if (isNaN(val)) return '-';

    var pct = val * 100;
    var decimals = 0;
    if (pct <= 0) decimals = 1;
    else if (pct < 0.001) decimals = 4;
    else if (pct < 0.01) decimals = 3;
    else if (pct < 1) decimals = 2;
    else if (pct < 100) decimals = 1;
    return utils.formatNumber(pct, decimals) + "%";
  });

  text.parser(function(s) {
    return parseFloat(s) / 100;
  });

  text.value(0);
  text.on('change', function(e) {
    var pct = e.value;
    slider.pct(toSliderPct(pct));
    control.dispatchEvent('simplify-start');
    onchange(pct);
    control.dispatchEvent('simplify-end');
  });

  function turnOn() {
    if (!MapShaper.datasetHasPaths(model.getEditingLayer().dataset)) {
      gui.alert("This dataset can not be simplified");
      return;
    }
    // TODO: skip menu if thresholds have been calculated
    menu.show();
  }

  function turnOff() {
    menu.hide();
    control.reset();
  }

  function onSubmit() {
    var opts = getSimplifyOptions();
    var dataset = model.getEditingLayer().dataset;
    if (dataset.arcs) {
      MapShaper.simplifyPaths(dataset.arcs, opts);
      if (opts.keep_shapes) {
        MapShaper.keepEveryPolygon(dataset.arcs, dataset.layers);
      }
    }
    el.show();
    menu.hide();
  }

  function getSimplifyOptions() {
    var method = El('#simplify-options input[name=method]:checked').attr('value') || null;
    return {
      method: method,
      keep_shapes: !!El("#g-import-retain-opt").node().checked
    };
  }

  function toSliderPct(p) {
    p = Math.sqrt(p);
    var pct = 1 - p;
    return pct;
  }

  function fromSliderPct(p) {
    var pct = 1 - p;
    return pct * pct;
  }

  function onchange(val) {
    if (_value != val) {
      _value = val;
      control.dispatchEvent('change', {value:val});
    }
  }

  control.show = function() {
    el.show();
    El('body').addClass('simplify');
  };

  control.reset = function() {
    el.hide();
    menu.hide();
    El('body').removeClass('simplify');
  };

  control.value = function(val) {
    if (!isNaN(val)) {
      // TODO: validate
      _value = val;
      slider.pct(toSliderPct(val));
      text.value(val);
    }
    return _value;
  };

  control.value(_value);
  return control;
};
