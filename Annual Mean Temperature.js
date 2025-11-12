// 1. GUNAKAN SHAPEFILE ROI DARI ASSET
var roi = Kaltim;  

// 2. MEMUAT DATA WORLDCLIM BIOCLIM (BIO1 = Annual Mean Temperature *10)
var bio1 = ee.Image("WORLDCLIM/V1/BIO")
              .select('bio01')
              .divide(10)
              .clip(roi); 

// 3. KLASIFIKASI + CLIP
var kelas = bio1.expression(
  "(b('bio01') < 20) ? 1" +
  ": (b('bio01') >= 20 && b('bio01') < 25) ? 2" +
  ": (b('bio01') >= 25 && b('bio01') < 30) ? 3" +
  ": 4"
).clip(roi); 


// 4. TAMPILKAN DI PETA
Map.centerObject(roi, 7);
var palette = ['00ff00','ffff00','ff9900','ff0000'];
Map.addLayer(kelas, {min:1, max:4, palette:palette}, 'Kelas Suhu (°C)');

// 5. MEMBUAT LEGENDA
var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});
var legendTitle = ui.Label({
  value: 'Annual Mean Temp (°C)',
  style: {fontWeight: 'bold', fontSize: '14px', margin: '0 0 6px 0'}
});
legend.add(legendTitle);

var names = ['< 20 °C','20–25 °C','25–30 °C','> 30 °C'];
for (var i = 0; i < palette.length; i++) {
  var colorBox = ui.Label({
    style: {backgroundColor: '#' + palette[i], padding: '8px', margin: '0 0 4px 0'}
  });
  var description = ui.Label({value: names[i], style: {margin: '0 0 4px 6px'}});
  legend.add(ui.Panel({widgets: [colorBox, description], layout: ui.Panel.Layout.Flow('horizontal')}));
}
Map.add(legend);

// 5. MEMBUAT GRID 2x2
var bounds = roi.geometry().bounds();
var coords = ee.List(bounds.coordinates().get(0));
var xmin = ee.Number(ee.List(coords.get(0)).get(0));
var ymin = ee.Number(ee.List(coords.get(0)).get(1));
var xmax = ee.Number(ee.List(coords.get(2)).get(0));
var ymax = ee.Number(ee.List(coords.get(2)).get(1));

var rows = 2;
var cols = 2;
var dx = xmax.subtract(xmin).divide(cols);
var dy = ymax.subtract(ymin).divide(rows);

var gridList = [];
var id = 0;
for (var i = 0; i < cols; i++) {
  for (var j = 0; j < rows; j++) {
    var x0 = xmin.add(dx.multiply(i));
    var y0 = ymin.add(dy.multiply(j));
    var x1 = x0.add(dx);
    var y1 = y0.add(dy);
    var cell = ee.Geometry.Rectangle([x0, y0, x1, y1]);
    gridList.push(ee.Feature(cell, {'id': id}));
    id++;
  }
}
var grid = ee.FeatureCollection(gridList);
var grid_filtered = grid.filterBounds(roi);

Map.addLayer(grid_filtered, {}, 'Grid 2x2');

// 6. EXPORT Annual Mean Temp per GRID
grid_filtered.toList(grid_filtered.size()).evaluate(function(grids) {
  grids.forEach(function(feature, i) {
    var gridGeom = ee.Feature(feature).geometry();
    Export.image.toDrive({
      image: bio1.clip(gridGeom).float(),
      description: 'Bio1_Grid_' + i,
      folder: 'WorldClim_Export_Grid2x2',
      fileNamePrefix: 'AnnualMeanTemp_grid_' + i,
      region: gridGeom,
      scale: 1000,   // resolusi asli WorldClim v1
      crs: 'EPSG:4326',
      maxPixels: 1e13
    });
  });
});