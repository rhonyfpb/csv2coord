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

var writer = csv.createCsvFileWriter(path + resultFile, {
  separator: ";",
  quote: ""
});

var i = 0;

reader.addListener("data", function(data) {
  var direccion = data[columnName];

  var DIRECCION = direccion.toUpperCase();
  DIRECCION = DIRECCION.replace(/,/g, "");

  if(direccion /*&& i<10*/ /*&& (i==186 && i==186)*/) {
    var tokens = DIRECCION.split(/\s+/);
    var nombres = "JIMENEZ|EL DORADO|AMERICAS";

    // procesamiento de los tokens
    var j = 0;
    var result = [];
    var preResult = [];
    var postResult = [];
    var exp = [
      /^(AVENIDA|AVE|AV|AC|AK)$/,
      nombres,
      /^(CALLE|CLL|CL|CARRERA|CRA|KRA|CR|KR|DIAGONAL|DIAG|DIA|DG|TRANSVERSAL|TRANSV|TRANS|TRA|TR)$/,
      /^\d{1,3}[A-Z]?$/,
      /^(|[A-Z])$/,
      /^(SUR|ESTE)$/,
      /^BIS$/,
      /^(|NO|#)$/,
      /^\d{1,3}[A-Z]?$/,
      /^(|[A-Z])$/,
      /^(|-)$/,
      /^\d{1,3}$/,
      /^(SUR|ESTE)$/
    ];
    var skip = -Infinity;

    tokens.length > 0 && tokens.forEach(function(value, index, arr) {
      if(index >= skip) {
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
              if(exp[j+2].test(value)) {
                j++;
              } else {
                preResult.push(value); // PRE
                break;
              }
            }
          case 1: // Nombres de vias
            var regTemp = new RegExp("^(" + exp[j] + ")$");
            if(regTemp.test(value)) {
              result.push(value);
              j = 6;
              break;
            } else {
              // Se busca la coincidencia en la cadena completa
              if(exp[j+1].test(value)) {
                ;
              } else {
                regTemp = new RegExp("(" + exp[j] + ")");
                var resReg = regTemp.exec(arr.join(" "));
                var pattern = resReg ? resReg[0] : null;
                if(pattern) {
                  result.push(pattern);
                  skip = index + pattern.split(" ").length;
                  j = 6;
                  break;
                } else {
                  skip = -Infinity;
                }
              }
            }
            j++;
          case 2: // Tipo de via
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
          case 3: // Numero de via
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
          case 4: // Prefijo o cuadrante
            if(exp[j].test(value)) {
              if(/^[A-Z]$/.test(value)) {
                result.push(value);
              }
              j++;
              break;
            } else {
              j++;
            }
          case 5: // Calificador sur o de este
            if(exp[j].test(value)) {
              result.push(value);
              j++;
              break;
            } else {
              j++;
            }
          case 6: // Calificador bis
            if(exp[j].test(value)) {
              result.push(value);
              j++;
              break;
            } else {
              j++;
            }
          case 7: // Separador de numero
            if(exp[j].test(value)) {
              // Se evita la inclusion de cualquier simbolo de numero
              j++;
              break;
            } else {
              j++;
            }
          case 8: // Numero de via generadora
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
          case 9: // Prefijo o cuadrante de via generadora
            if(exp[j].test(value)) {
              if(/^[A-Z]$/.test(value)) {
                result.push(value);
              }
              j++;
              break;
            } else {
              j++;
            }
          case 10: // Separador de placa
            if(exp[j].test(value)) {
              j++;
              break;
            } else {
              j++;
            }
          case 11: // Numero de placa
            if(exp[j].test(value)) {
              result.push(value);
              j++;
            }
            break;
          case 12: // Calificador sur o de este
            if(exp[j].test(value)) {
              result.push(value);
              j++;
              break;
            } else {
              j++;
            }
          case 13:
            postResult.push(value); // POST
            break;
        }
      }
      
    });

    // resultado
    console.log(chalk.yellow(i+1) + " " + DIRECCION + chalk.yellow(" = ") + chalk.green(tokens));
    console.log(chalk.yellow((i+1) + " PRE: ") + chalk.red(preResult.join(" ")));
    console.log(chalk.yellow((i+1) + " RES: ") + chalk.red(result.join(" ")));
    console.log(chalk.yellow((i+1) + " POS: ") + chalk.red(postResult.join(" ")));

    // Revision de la direccion
    // 1 Tipo de via = AV, AC, AK, CL, KR, DG, TR
    // 2 Nombre o numero de via
    // 3 Prefijo o cuadrante
    // 4 Numero de via generadora
    // 5 Prefijo o cuadrante de via generadora
    // 6 Numero de placa

    writer.writeRecord([ DIRECCION, result.join(" ") ]);

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
  console.log(chalk.blue("FIN DE LA LECTURA DEL ARCHIVO"));
});