
var features = ee.FeatureCollection([]);

// Create a map
var map = ui.Map();

// Add the map to the UI
ui.root.add(map);

// Register a click handler for the map
map.onClick(function(coords) {
  // Create a point geometry from the clicked coordinates
  var roi = ee.Geometry.Point(coords.lon, coords.lat);
  var marker = ui.Map.Layer(
      ee.Geometry.Point(coords.lon, coords.lat), {color: 'red'}, 'Marker');
      map.layers().set(1, marker);

  // Define a function to calculate NDWI, NDTI, NDCI, and WQI
  function calculateIndices(image) {
    var ndwi = image.normalizedDifference(['B3', 'B5']).rename('NDWI');
    var ph = image.expression(
     '(((B3 + B5) / 2)+1)*7', {
      'B3': image.select('B3'),
      'B5': image.select('B5')
    }
  ).rename('pH');

  
    return image.addBands([ndwi, ph]);
  }

  // Get the start and end dates from the user
  var startDate = prompt('Enter the start date in YYYY-MM-DD format:');
  var endDate = prompt('Enter the end date in YYYY-MM-DD format:');

  // Load Landsat 8 imagery and apply the index function
  var collection = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA')
    .filterBounds(roi)
    .filterDate(startDate, endDate)
    .map(calculateIndices);

  // Reduce the collection to a single image by taking the median
  var image = collection.median();

  // Add NDWI, NDTI, NDCI, and WQI layers to the map only for the ROI
  var ndwiVis = {min:-1, max:1, palette:['blue', 'white', 'green']};
 
  var phVis = {min:0, max:100, palette:['red', 'yellow', 'green']};
  map.addLayer(image.select('NDWI').clip(roi), ndwiVis, 'NDWI');
 
  map.addLayer(image.select('pH').clip(roi), phVis, 'pH');
  

  // Convert the image to a feature collection
  var fc = image.reduceRegions({
    collection: roi,
    reducer: ee.Reducer.mean(),
    scale: 30
  });

  // Print the feature collection to the console
  print(fc);

  // Create charts and add them to the UI
  var ndwiChart = ui.Chart.image.series({
    imageCollection: collection.select(['NDWI']),
    region: roi,
    reducer: ee.Reducer.mean(),
    scale: 30
  }).setOptions({
    title: 'Graph of NDWI',
    vAxis: {
      title: 'Index value'
    },
    hAxis: {
      title: 'Date',
      format: 'YYYY-MM-dd'
    },
    colors: ['purple'] 
  });
var phChart = ui.Chart.image.series({
  imageCollection: collection.select(['pH']),
  region: roi,
  reducer: ee.Reducer.mean(),
  scale: 30
}).setOptions({
  title: 'Graph of pH Value',
  vAxis: {
    title: 'Index value'
  },
  hAxis: {
    title: 'Date',
    format: 'YYYY-MM-dd'
  },
  colors: ['red'] // Set the color of the graph to red
});


// Add charts to the UI
ui.root.widgets().add(ndwiChart);
ui.root.widgets().add(ui.Label('Feature collection:'));
ui.root.widgets().add(phChart);
ui.root.widgets().add(ui.Label('Feature collection:'));
});

// Display instructions to the user
var instructions = 'Click on the map to select a location and get water quality information.';
ui.root.add(ui.Label(instructions));
