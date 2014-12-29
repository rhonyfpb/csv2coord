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

  if(direccion /*&& i<10*/ && (i==25 || i==25)) {
    //console.log((i+1) + " " + DIRECCION);
    //console.log("%d %s", ());
    var tokens = DIRECCION.split(/\s+/);
    //console.log(chalk.yellow(i+1) + " " + DIRECCION + chalk.yellow(" = ") + chalk.green(tokens));
    

    // procesamiento de los tokens
    var j = 0;
    var result = [];
    var preResult = [];
    var postResult = [];
    var exp = [
      /^(AVENIDA|AVE|AV|AC|AK)$/,
      /^(CALLE|CLL|CL|CARRERA|CRA|KRA|CR|KR|DIAGONAL|DIAG|DIA|DG|TRANSVERSAL|TRANSV|TRANS|TRA|TR)$/,
      /^\d{1,3}[A-Z]?$/,
      /^(|[A-Z])$/,
      /^SUR$/,
      /^(|NO|#)$/,
      /^\d{1,3}[A-Z]?$/,
      /^(|[A-Z])$/,
      /^(|-)$/,
      /^\d{1,3}$/,
      /^SUR$/
    ];

    tokens.length > 0 && tokens.forEach(function(value, index, arr) {
      switch(j) {
        case 0: // Tipo de via
          if(exp[j].test(value)) {
            if(/^AC$/.test(value)) {
              result.push("AC");
            } else {
              if(/^AK$/.test(value)) {
                result.push("AK");
              } else {
                result.push("AV");
              }
            }
            j++;
            break;
          } else {
            if(exp[j+1].test(value)) {
              j++;
            } else {
              preResult.push(value); // PRE
              break;
            }
          }
        case 1: // Tipo de via
          if(exp[j].test(value)) {
            var prev = result[0];
            var prevExist = !!prev;
            if(/^(CALLE|CLL|CL)$/.test(value)) {
              prevExist ? result[0] = "AC" : result.push("CL");
            } else {
              if(/^(CARRERA|CRA|KRA|CR|KR)$/.test(value)) {
                prevExist ? result[0] = "AK" : result.push("KR");
              } else {
                if(/^(DIAGONAL|DIAG|DIA|DG)$/.test(value)) {
                  result.push("DG");
                } else {
                  result.push("TR");
                }
              }
            }
            j++;
            break;
          } else {
            j++;
          }
        case 2: // Numero de via
          if(exp[j].test(value)) {
            if(/^\d{1,3}$/.test(value)) {
              result.push(value);
            } else {
              result.push(/\d+/.exec(value)[0]);
              result.push(/[A-Z]/.exec(value)[0]);
              j++;
            }
            j++;
          }
          break;
        case 3: // Prefijo o cuadrante
          if(exp[j].test(value)) {
            if(/^[A-Z]$/.test(value)) {
              result.push(value);
            }
            j++;
            break;
          } else {
            j++;
          }
        case 4:
          if(exp[j].test(value)) {
            result.push(value);
            j++;
            break;
          } else {
            j++;
          }
        case 5: // Separador de numero
          if(exp[j].test(value)) {
            // Se evita la inclusion de cualquier simbolo de numero
            j++;
          }
          break;
        case 6: // Numero de via generadora
          if(exp[j].test(value)) {
            if(/^\d{1,3}$/.test(value)) {
              result.push(value);
            } else {
              result.push(/\d+/.exec(value)[0]);
              result.push(/[A-Z]/.exec(value)[0]);
              j++;
            }
            j++;
          }
          break;
        case 7: // Prefijo o cuadrante de via generadora
          if(exp[j].test(value)) {
            if(/^[A-Z]$/.test(value)) {
              result.push(value);
            }
            j++;
            break;
          } else {
            j++;
          }
        case 8: // Separador de placa
          if(exp[j].test(value)) {
            j++;
          }
          break;
        case 9: // Numero de placa
          if(exp[j].test(value)) {
            result.push(value);
            j++;
          }
          break;
        case 10: // Calificador sur
          if(exp[j].test(value)) {
            result.push(value);
            j++;
            break;
          } else {
            j++;
          }
        case 11:
          postResult.push(value); // POST
          break;
      }
    });

    // resultado
    if(result.join(" ").indexOf("AV") !== -1) {
      console.log(chalk.yellow(i+1) + " " + DIRECCION + chalk.yellow(" = ") + chalk.green(tokens));
      console.log(chalk.yellow((i+1) + " PRE: ") + chalk.red(preResult.join(" ")));
      console.log(chalk.yellow((i+1) + " RES: ") + chalk.red(result.join(" ")));
      console.log(chalk.yellow((i+1) + " POS: ") + chalk.red(postResult.join(" ")));
    }
    /*console.log(chalk.yellow((i+1) + " PRE: ") + chalk.red(preResult.join(" ")));
    console.log(chalk.yellow((i+1) + " RES: ") + chalk.red(result.join(" ")));
    console.log(chalk.yellow((i+1) + " POS: ") + chalk.red(postResult.join(" ")));*/
    //console.log(chalk.yellow(i+1) + " " + chalk.red(result));
    //i++;

    // Revision de la direccion
    // 1 Tipo de via = AV, AC, AK, CL, KR, DG, TR
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
  i++;
});

reader.addListener("end", function() {
  console.log("FIN DE LA LECTURA DEL ARCHIVO");
});