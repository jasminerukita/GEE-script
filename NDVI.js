//MENAMPILKAN SHAPEFILE//
Map.addLayer(Kaltim)
Map.centerObject(Kaltim,10)

//MENAMBAHKAN CITRA LANDSAT 8//
var L8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")

//SORTIR BERDASARKAN WILAYAH//
var L8Kaltim = L8.filterBounds(Kaltim);

//SORTIR BERDASARKAN TANGGAL//
var L8tanggal = L8.filterDate('2022-01-01','2024-12-31')

//MENGHILANGKAN AWAN//
var masking = function(img){
 var cloudshadowBitmask = (1<<4)
 var cloudshadowmask = (1<<3)
 var qa = img.select('QA_PIXEL')
 var maskshadow = qa.bitwiseAnd(cloudshadowBitmask).eq(0)
 var maskcloud = qa.bitwiseAnd(cloudshadowmask).eq(0)
 var mask = maskshadow.and(maskcloud)
 return img.updateMask(mask)
};

var L8clear = L8tanggal.sort('CLOUD_COVER_LAND')
                      .map(masking)
                      .median();

//POTONG BATAS ADMIN//
var L8potong = L8clear.clip(Kaltim)

//FAKTOR SKALA//
var scale = function applyScaleFactors(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBands,null,true);
  };
  
  var L8scale = scale(L8potong);
  
  //TAMPILKAN CITRA// 
  Map.addLayer(L8scale);
  
  //MENAMPILKAN CITRA KOMPOSIT//
  Map.addLayer(L8scale, imageVisParam, 'Kaltim True Color');
  
  //MEMPOSISIKAN CENTER//
  Map.centerObject(BPP,10);
  
    //NORMALIZED DIFFERENCE VEGETATION INDEX//
//Mendefinisikan Band NIR dan Red//
var nir = L8scale.select('SR_B5');
var red = L8scale.select('SR_B4');

//MENGHITUNG NDVI DENGAN RUMUS//
var NDVI = nir.subtract(red).divide(nir.add(red)).rename('NDVI');

//MENGKLASIFIKASIKAN NILAI NDVI//
var ndviSJ = NDVI.gt(-1).and(NDVI.lte(0.2)).selfMask()
var ndviJ = NDVI.gt(0.2).and(NDVI.lte(0.4)).selfMask()
var ndviS = NDVI.gt(0.4).and(NDVI.lte(0.6)).selfMask()
var ndviL = NDVI.gt(0.6).and(NDVI.lte(0.8)).selfMask()
var ndviSL = NDVI.gt(0.8).and(NDVI.lte(1)).selfMask()

//MEWARNAI//
Map.addLayer(ndviSJ, imageVisParam2,'Sangat Jarang')
Map.addLayer(ndviJ, imageVisParam3,'Jarang')
Map.addLayer(ndviS, imageVisParam4,'Sedang')
Map.addLayer(ndviL, imageVisParam5,'Lebat')
Map.addLayer(ndviSL, imageVisParam6,'Sangat Lebat')

//MENGATUR POSISI LEGENDA//
var legend = ui.Panel({ 
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

//MEMBUAT JUDUL LEGENDA//
var legendTitle = ui.Label({
  value: 'NDVI',
  style: {
    fontWeight: 'bold',
    fontSize: '18px',
    margin: '0 0 4px 0',
    padding: '0'
  }
});

//MENAMPILKAN JUDUL KE LEGENDA//
legend.add(legendTitle);

//CREATE AND STYLE 1 ROW OF THE LEGEND//
var makeRow = function (color,name) {
  
      //CREATE THE LABEL THAT IS ACTUALLY THE COLORED BOX//
      var colorBox = ui.Label({
        style: {
          backgroundColor: '#' + color,
          
          //USE PADDING TO GIVE THE BOX HEIGHT AND WIDTH//
          padding: '8px',
          margin:'0 0 4px 0'
        }
        });
        
        //CREATE THE LABEL FILLED WITH THE DESCRIPTION TEXT//
        var description = ui.Label({
          value: name,
          style: {margin: '0 0 4px 6px'}
        });
        
        //RETURN THE PANEL//
        return ui.Panel({ 
          widgets: [colorBox, description],
          layout: ui.Panel.Layout.Flow('horizontal')
        })
};

//PALETTE WITH THE COLORS//
var palette = ['ff370a','ffa535','fcff4e','aaff39','19ff0a'];

//NAME OF THE LEGEND//
var names = ['Sangat Jarang','Jarang','Sedang','Lebat', 'Sangat Lebat'];

//ADD COLOR AND NAMES//
for (var i = 0; i < 5; i++) {
  legend.add(makeRow(palette[i], names[i]));
  }
//ADD LEGEND TO MAP//
Map.add (legend);

//Buat Grid 2x2
var bounds = Kaltim.geometry().bounds();
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
var grid_kaltim = grid.filterBounds(Kaltim);

// Ekspor NDVI per grid
grid_kaltim.toList(grid_kaltim.size()).evaluate(function(grids) {
  grids.forEach(function(feature, i) {
    var gridGeom = ee.Feature(feature).geometry();
    Export.image.toDrive({
      image: NDVI.clip(gridGeom).float(),
      description: 'NDVI_Landsat8_Kaltim_Grid_' + i,
      folder: 'NDVI_Landsat8_Kaltim_Grid2x2',
      fileNamePrefix: 'NDVI_landsat8_kaltim_grid_' + i,
      region: gridGeom,
      scale: 30,
      crs: 'EPSG:4326',
      maxPixels: 1e13
    });
  });
});

Map.centerObject(Kaltim, 7);
Map.addLayer(grid_kaltim, {}, 'Grid 2x2');