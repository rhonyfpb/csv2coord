/*
//Converter Class
var Converter = require("csvtojson").core.Converter;
var fs = require("fs");

var csvFileName = "./files/establecimientosdealojamiento.csv";
var fileStream = fs.createReadStream(csvFileName);
//new converter instance
var csvConverter = new Converter({
	constructResult: true,
	delimeter: ";"
});

//end_parsed will be emitted once parsing finished
csvConverter.on("end_parsed",function(jsonObj){
   console.log(jsonObj); //here is your result json object
});

//read from file
fileStream.pipe(csvConverter);
*/

/*
//var columns = ["column1", "column2", "column3"];
var columns = ["ID", "RNT", "NOMBRE COMERCIAL", "TIPO", "DIRECCION", "LOCALIDAD", "TELEFONO", "E MAIL", "PAGINA WEB", "RANGO TARIFA", "ZONA", "ESTADO"];
require("csv-to-array")({
   file: "./files/establecimientosdealojamiento.csv",
   columns: columns
}, function (err, array) {
  console.log(err || array);
});
*/

var csv = require("ya-csv");
var reader = csv.createCsvFileReader("./files/establecimientosdealojamiento.csv", {
    'separator': ';',
    'columnsFromHeader': true
    //'quote': '"',
    //'escape': '"',       
    //'comment': '',
});
//var writer = new csv.CsvWriter(process.stdout);
reader.addListener('data', function(data) {
    //writer.writeRecord([ data[0] ]);
    console.log(data);
});