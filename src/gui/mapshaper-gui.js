/* @requires
mapshaper-gui-lib
mapshaper-simplify-control
mapshaper-import-control
mapshaper-export-control
mapshaper-repair-control
mapshaper-map
mapshaper-maplayer
mapshaper-simplify
mapshaper-export
mapshaper-shapes
mapshaper-topology
mapshaper-keep-shapes
mapshaper-console
mapshaper-gui-model
*/

Browser.onload(function() {
  El('#mshp-version').text('v' + MapShaper.VERSION);
  if (!gui.browserIsSupported()) {
    El("#mshp-not-supported").show();
  } else {
    gui.startEditing();
  }
});

gui.startEditing = function() {
  var model = new Model().on('select', onSelect),
      map, repair, simplify;
  gui.startEditing = function() {};
  gui.alert = new ErrorMessages(model);

  // TODO: untangle dependencies between SimplifyControl, RepairControl and Map
  map = new MshpMap(model);
  repair = new RepairControl(map);
  simplify = new SimplifyControl(model);
  new ImportControl(model);
  new Console(model);
  new ExportControl(model);

  simplify.on('simplify-start', function() {
    repair.hide();
  });
  simplify.on('simplify-end', function() {
    repair.update();
  });
  simplify.on('change', function(e) {
    map.setSimplifyPct(e.value);
  });
  repair.on('repair', function() {
    model.updated();
  });

  function onSelect(e) {
    El('#mode-buttons').show();
    repair.reset();

    if (MapShaper.layerHasPaths(e.layer)) {
      // TODO: move this to simplify control...
      // simplify.value(e.dataset.arcs.getRetainedPct());

      if (!e.opts.no_repair) {
        repair.setDataset(e.dataset);
        // use timeout so map appears before the repair control calculates
        // intersection data, which can take a little while
        setTimeout(function() {
          repair.update();
        }, 10);
      }
    }
  }
};
