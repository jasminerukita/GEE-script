// 1. GUNAKAN SHAPEFILE DARI ASSET
var wilayah = Kaltim;

// 2. MEMUAT DEM SRTM DAN CLIP DENGAN SHAPEFILE
var dem = ee.Image("USGS/SRTMGL1_003");
var dem_clip = dem.clip(wilayah);

// 3. BATASI ELEVASI ANTARA 0–2000 M
var dem_limited = dem_clip.where(dem_clip.lt(0), 0)
                          .where(dem_clip.gt(2000), 2000);

// 4. TAMPILKAN DEM DI PETA
Map.centerObject(wilayah, 9);
Map.addLayer(dem_limited, 
             {min: 0, max: 2000, palette: ['0000ff','00ff00','ffff00','ff9900','663300']}, 
             'DEM 0–2000 meter');

// 5. MEMBUAT LEGENDA

// MENGATUR POSISI LEGENDA
var legend = ui.Panel({ 
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

// MEMBUAT JUDUL LEGENDA
var legendTitle = ui.Label({
  value: 'DEM (Elevasi dalam meter)',
  style: {
    fontWeight: 'bold',
    fontSize: '16px',
    margin: '0 0 6px 0',
    padding: '0'
  }
});

// MENAMPILKAN JUDUL KE LEGENDA
legend.add(legendTitle);

// FUNGSI UNTUK MEMBUAT 1 BARIS LEGENDA
var makeRow = function(color, name) {
  var colorBox = ui.Label({
    style: {
      backgroundColor: '#' + color,
      padding: '8px',
      margin:'0 0 4px 0'
    }
  });

  var description = ui.Label({
    value: name,
    style: {margin: '0 0 4px 6px'}
  });

  return ui.Panel({ 
    widgets: [colorBox, description],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
};

// PALETTE WARNA DAN LABELNYA
var palette = ['0000ff','00ff00','ffff00','ff9900','663300']; // biru → coklat
var names = ['0–400 m', '400–800 m', '800–1200 m', '1200–1600 m', '1600–2000 m'];

// LOOP UNTUK MENAMBAHKAN KE LEGENDA
for (var i = 0; i < palette.length; i++) {
  legend.add(makeRow(palette[i], names[i]));
}

// TAMBAHKAN LEGENDA KE MAP
Map.add(legend);

// 6. MEMBUAT GRID 2x2

var bounds = wilayah.geometry().bounds();
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
var grid_filtered = grid.filterBounds(wilayah);

Map.addLayer(grid_filtered, {}, 'Grid 2x2');

// 7. EXPORT DEM per GRID

grid_filtered.toList(grid_filtered.size()).evaluate(function(grids) {
  grids.forEach(function(feature, i) {
    var gridGeom = ee.Feature(feature).geometry();
    Export.image.toDrive({
      image: dem_limited.clip(gridGeom).float(),
      description: 'DEM_Grid_' + i,
      folder: 'DEM_Grid_Export_2x2',
      fileNamePrefix: 'DEM_grid_' + i,
      region: gridGeom,
      scale: 30,
      crs: 'EPSG:4326',
      maxPixels: 1e13
    });
  });
});