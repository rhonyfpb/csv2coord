var csv = require("ya-csv");
//var request = require("request");
var nconf = require("nconf");
var chalk = require("chalk");

nconf.file({ file: "./config.json" });

var path = nconf.get("path");
var sourceFile = nconf.get("sourceFile");
var resultFile = nconf.get("resultFile");
var columnName = nconf.get("columnName");

var reader = csv.createCsvFileReader(path + sourceFile, {
  separator: ";",
  columnsFromHeader: true
});

/*var writer = csv.createCsvFileWriter("./files/establecimientosdealojamiento-procesado.csv", {
  separator: ";",
  quote: ""
});*/

var i = 0;

reader.addListener("data", function(data) {
  var direccion = data[columnName];

  var DIRECCION = direccion.toUpperCase();
  DIRECCION = DIRECCION.replace(/,/g, "");

  if(direccion && i<5) {
    //console.log((i+1) + " " + DIRECCION);
    //console.log("%d %s", ());
    var tokens = DIRECCION.split(/\s+/);
    console.log(chalk.yellow(i+1) + " " + DIRECCION + chalk.yellow(" = ") + chalk.green(tokens));
    

    // procesamiento de los tokens
    var j = 0;
    var result = "";
    var exp = [
      /^(AVENIDA|AVE|AV)$/
    ];

    tokens.length > 0 && tokens.forEach(function(value, index, arr) {
      if(exp[j].test(value)) {
        result += value;
      }
    });

    // resultado
    console.log(chalk.yellow(i+1) + " " + chalk.red(result));
    i++;

    // Revision de la direccion
    // 1 Tipo de via = AV, AC, AK, KR, CL, DG, TR
    // 2 Nombre o numero de via
    // 3 Prefijo o cuadrante
    // 4 Numero de via generadora
    // 5 Prefijo o cuadrante de via generadora
    // 6 Numero de placa

    /*var options = {
      url: "http://www.direccionesbogota.com/ajax/search/co/bogota?query=" + direccion,
      headers: {
        "X-Requested-With": "XMLHttpRequest"
      }
    };
    request(options, function(error, response, body) {
      var result = JSON.parse(body);
      var coord = result ? result.coordinates : undefined;
      if(coord) {
        writer.writeRecord([ data["NOMBRE COMERCIAL"], data.DIRECCION, data.TELEFONO, data["E MAIL"], data["PAGINA WEB"], coord[0], coord[1] ]);
      }
    });*/
  }
});

reader.addListener("end", function() {
  console.log("FIN DE LA LECTURA DEL ARCHIVO");
});