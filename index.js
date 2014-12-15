var csv = require("ya-csv");
var request = require("request");

var reader = csv.createCsvFileReader("./files/establecimientosdealojamiento.csv", {
  separator: ";",
  columnsFromHeader: true
});

var writer = csv.createCsvFileWriter("./files/establecimientosdealojamiento-procesado.csv", {
  separator: ";",
  quote: ""
});

reader.addListener("data", function(data) {
  var direccion = data.DIRECCION;
  if(direccion) {
    console.log("direccion", direccion);
    var options = {
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
    });
  }
});

reader.addListener("end", function() {
  // fin de lectura del csv
});