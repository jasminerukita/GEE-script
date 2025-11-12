// ===============================
// 1. ROI 
// ===============================
var roi = ee.FeatureCollection("projects/ee-117210058/assets/Kaltim"); 

// ===============================
// 2. Panggil data WorldClim V1 - BIO12 (Annual Precipitation)
// ===============================
var worldclim = ee.Image("WORLDCLIM/V1/BIO");
var bio12 = worldclim.select('bio12'); // Annual Precipitation
var precip_roi = bio12.clip(roi);

// ===============================
// 3. Visualisasi + Legenda
// ===============================
var visPrecip = {
  min: 0,
  max: 4000,
  palette: ['#f7fbff','#6baed6','#08519c']
};
Map.centerObject(roi, 6);
Map.addLayer(precip_roi, visPrecip, 'Annual Precipitation');

// ===============================
// Legenda Curah Hujan
// ===============================
function addDiscreteLegend(title, palette, names) {
  var legend = ui.Panel({
    style: {
      position: 'bottom-left',
      padding: '8px',
      backgroundColor: 'white'
    }
  });

  // Judul legenda
  var legendTitle = ui.Label({
    value: title,
    style: {
      fontWeight: 'bold',
      fontSize: '14px',
      margin: '0 0 6px 0'
    }
  });
  legend.add(legendTitle);

  // Tambahkan kotak warna + label interval
  for (var i = 0; i < names.length; i++) {
    var colorBox = ui.Label({
      style: {
        backgroundColor: palette[i],
        padding: '8px',
        margin: '2px'
      }
    });

    var description = ui.Label({
      value: names[i],
      style: {margin: '4px 0'}
    });

    var row = ui.Panel({
      widgets: [colorBox, description],
      layout: ui.Panel.Layout.flow('horizontal')
    });

    legend.add(row);
  }

  Map.add(legend);
}

// ===============================
// Pemanggilan
// ===============================
var precipPalette = ['#f7fbff','#c6dbef','#6baed6','#08519c'];
var precipClasses = [
  '0 – 1000 mm',
  '1000 – 2000 mm',
  '2000 – 3000 mm',
  '3000 – 4000 mm'
];

addDiscreteLegend('Curah Hujan Tahunan (mm)', precipPalette, precipClasses);


// ===============================
// 4. Membuat GRID 2x2
// ===============================
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

// ===============================
// 5. EXPORT Annual Precip per GRID
// ===============================
grid_filtered.toList(grid_filtered.size()).evaluate(function(grids) {
  grids.forEach(function(feature, i) {
    var gridGeom = ee.Feature(feature).geometry();
    Export.image.toDrive({
      image: bio12.clip(gridGeom).float(),
      description: 'Bio12_Grid_' + i,
      folder: 'WorldClim_Precip_Grid2x2',
      fileNamePrefix: 'AnnualPrecip_grid_' + i,
      region: gridGeom,
      scale: 1000,   // resolusi asli WorldClim v1
      crs: 'EPSG:4326',
      maxPixels: 1e13
    });
  });
});
