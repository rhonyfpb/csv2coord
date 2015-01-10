var csv = require("ya-csv"); // gestor de escritura y lectura de archivos csv
var request = require("request"); // gestor de peticiones http
var nconf = require("nconf"); // permite manejar archivos de configuracion (config.json)
var chalk = require("chalk"); // dota a la consola de colores
var db = require("diskdb"); // base de datos a disco

nconf.argv().file({ file: "./config.json" });

var path = nconf.get("path");

var sourceFile = nconf.get("sourceFile");
var resultFile = nconf.get("resultFile");
var errorFile = nconf.get("errorFile");

var colsName = nconf.get("columnsName");
var columnDirectionIndex = nconf.get("columnDirectionIndex");

var numberColumnsError = nconf.get("columnsError");
var numberColumnsResult = nconf.get("columnsResult");

var names = nconf.get("names");

console.log(chalk.yellow("-----------------------------------------------------------------------"));
console.log(chalk.yellow("- CSV2Coord                                                           -"));
console.log(chalk.yellow("- El programa acepta los parametros: --eq=# --lte=# --gte=# --req=0|1 -"));
console.log(chalk.yellow("-----------------------------------------------------------------------"));

// parametros de revision de columnas
var eq = nconf.get("eq") !== undefined ? Number(nconf.get("eq")) : undefined; // ==
var lte = nconf.get("lte") !== undefined ? Number(nconf.get("lte")) : Infinity; // <=
var gte = nconf.get("gte") !== undefined ? Number(nconf.get("gte")) : -Infinity; // <=
if(eq !== undefined) {
  lte = gte = eq;
}

// para la ejecucion del request en el servidor remoto
var req = nconf.get("req") === undefined ? true : Boolean(Number(nconf.get("req")));

var reader = csv.createCsvFileReader(path + sourceFile, {
  separator: ";",
  columnsFromHeader: true
});

var errorWriter = csv.createCsvFileWriter(path + errorFile, {
  separator: ";",
  quote: ""
});

var writer = csv.createCsvFileWriter(path + resultFile, {
  separator: ";",
  quote: ""
});

var i = 0;

db.connect(__dirname, ["dirs"]);

reader.addListener("data", function(data) {
  // en data se obtiene la informacion de la fila del archivo
  var direccion = data[colsName[columnDirectionIndex]];

  var DIRECCION = direccion.toUpperCase();
  DIRECCION = DIRECCION.replace(/,/g, "");

  if(direccion && (i>=gte && i<=lte)) {
	
    var tokens = DIRECCION.split(/\s+/);

    // procesamiento de los tokens
    var j = 0;
    var result = [];
    var preResult = [];
    var postResult = [];
    var exp = [
      /^(AVENIDA|AVE|AV|AC|AK)$/,
      names,
      /^(CALLE|CLL|CL|CARRERA|CRA|KRA|CR|KR|DIAGONAL|DIAG|DIA|DG|TRANSVERSAL|TRANSV|TRANS|TRA|TR|TV)$/,
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
                    result.push("TV");
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
    
    // Revision de la direccion
    // 1 Tipo de via = AV, AC, AK, CL, KR, DG, TR
    // 2 Nombre o numero de via
    // 3 Prefijo o cuadrante
    // 4 Numero de via generadora
    // 5 Prefijo o cuadrante de via generadora
    // 6 Numero de placa
    result = result.join(" ");
    var valid;
    if(!isValidAddress(result)) {
      //console.log(chalk.red(i) + "\t" + chalk.red("DIRECCION INVALIDA"));
      valid = false;
    } else {
      //console.log(chalk.cyan(i) + "\t" + chalk.cyan("DIRECCION VALIDA"));
      valid = true;
    }

    // resultado
    //console.log(i + " " + DIRECCION + chalk.yellow(" = ") + chalk.green(tokens));
    //console.log(chalk.yellow(i + " PRE: ") + chalk.red(preResult.join(" ")));
    //console.log(chalk.yellow(i + " RES: ") + chalk.red(result));
    //console.log(chalk.yellow(i + " POS: ") + chalk.red(postResult.join(" ")));
    console.log(i + " " + chalk.yellow( DIRECCION + " = " ) + chalk.cyan( tokens ) + chalk.yellow( " = " + result ) + ( valid ? chalk.cyan(" VALIDA") : chalk.red(" INVALIDA") ) );

    // si hay direccion valida que consultar
    if(valid) {
      // se busca la direccion en la cache
      var resInCache = db.dirs.findOne({ "dir": result });
      if(resInCache) {
        errorWriter.writeRecord( [i].concat( numberColumnsError.map(function(va) {
          return data[colsName[va]];
        }).concat([ result, "VAL DIR", resInCache.coord.lat, resInCache.coord.lon, "VAL COORD" ]) ) ); // se anaden tambien la direccion procesada, el error de procesamiento de la direccion, lat, lon, error de coordenada

        writer.writeRecord( numberColumnsResult.map(function(vo) {
          return data[colsName[vo]];
        }).concat([ result, resInCache.coord.lat, resInCache.coord.lon ]) ); // se anaden la direccion procesada, la latitud y la longitud
      } else {
        var options = {
          url: "http://www.direccionesbogota.com/ajax/search/co/bogota?query=" + result,
          headers: {
            "X-Requested-With": "XMLHttpRequest"
          }
        };
        req && request(options, function(error, response, body) {
          console.log(chalk.yellow("Requesting " + result + "..."));
          var resultRequest = JSON.parse(body);
          var coord = resultRequest ? resultRequest.coordinates : undefined;
          if(coord) {
            // se salva en el cache
            if(!db.dirs.findOne({ "dir": result })) {
              db.dirs.save({
                dir: result,
                coord: {
                  lat: coord[1],
                  lon: coord[0]
                }
              });
            }
            
            errorWriter.writeRecord( [i].concat( numberColumnsError.map(function(va) {
              return data[colsName[va]];
            }).concat([ result, "VAL DIR", coord[1], coord[0], "VAL COORD" ]) ) ); // se anaden tambien la direccion procesada, el error de procesamiento de la direccion, lat, lon, error de coordenada

            writer.writeRecord( numberColumnsResult.map(function(vo) {
              return data[colsName[vo]];
            }).concat([ result, coord[1], coord[0] ]) ); // se anaden la direccion procesada, la latitud y la longitud
          } else {
            errorWriter.writeRecord( [i].concat( numberColumnsError.map(function(va) {
              return data[colsName[va]];
            }).concat([ result, "VAL DIR", "ERR LAT", "ERR LON", "NOT VALID COORD" ]) ) ); // se anaden tambien la direccion procesada, el error de procesamiento de la direccion, lat, lon, error de coordenada
          }
        });
      }
    } else {
      errorWriter.writeRecord( [i].concat( numberColumnsError.map(function(va) {
        return data[colsName[va]];
      }).concat([ result, "NOT VALID DIR", "ERR LAT", "ERR LON", "NOT VALID COORD" ]) ) ); // se anaden tambien la direccion procesada, el error de procesamiento de la direccion, lat, lon, error de coordenada
    }
  }
  i++;

  function isValidAddress(address) {
    
    //console.log("ADDRESS: " + chalk.green(address));

    var tokens = [];
    var temporal = "";
    var x = 0;
    var skipTo = -Infinity;
    var resultado = [];
    var expected = [
      "0,1,3,7",       "0,1,3,7,10",     "0,1,3,4,7",        "0,1,3,4,7,10", 
      "0,3,5,7,9",     "0,3,5,7,9,10",   "0,3,4,7,8,9",      "0,3,7,9", 
      "0,3,7,9,10",    "2,3,4,7,8,9,10", "0,3,5,7,8,9",      "0,3,7,8,9",       
      "0,3,7,8,9,10",  "2,3,7,9",        "2,3,4,5,7,9",      "2,3,4,5,7,9,10",  
      "2,3,5,7,9",     "2,3,5,7,9,10",   "2,3,5,7,8,9,10",   "2,3,7,9,10",      
      "2,3,5,7,8,9",   "2,3,6,7,9",      "2,3,6,7,9,10",     "2,3,4,6,7,9,10",  
      "2,3,6,7,8,9",   "2,3,6,7,8,9,10", "2,3,4,6,7,9",      "2,3,7,8,9",       
      "2,3,4,6,7,8,9", "2,3,4,7,9",      "2,3,7,8,9,10",     "2,3,4,7,8,9",     
      "2,3,4,5,7,8,9", "2,3,4,7,9,10",   "2,3,4,5,7,8,9,10", "2,3,4,6,7,8,9,10"
    ];

    var reg = [
      /^(AV|AC|AK)$/,
      names,
      /^(CL|KR|DG|TV)$/,
      /^\d{1,3}$/,
      /^[A-Z]$/,
      /^(SUR|ESTE)$/,
      /^BIS$/,
      /^\d{1,3}$/,
      /^[A-Z]$/,
      /^\d{1,3}$/,
      /^(SUR|ESTE)$/
    ];

    [].forEach.call(address, function(character, cIndex, cArreglo) {
      var type;
      if(cIndex > skipTo) {
        if(/^\s$/.test(character)) {
          type = "empty";
        } else {
          if(/^\d$/.test(character)) {
            type = "number";
          } else {
            type = "string";
          }
        }

        if(type === "empty") {
          while(x < reg.length) {
            if(x === 1) {
              if(new RegExp("^(" + reg[x] + ")$").test(temporal)) {
                tokens.push(temporal);
                resultado.push(x);
                x++;
                break;
              } else {
                var cad = "";
                var y = cIndex + 1;
                while(y < cArreglo.length && !(/^\s$/.test(cArreglo[y]))) {
                  cad += cArreglo[y];
                  y++;
                }
                if(cad) {
                  if(new RegExp("^(" + reg[x] + ")$").test( [temporal].concat(cad).join(" ") )) {
                    tokens.push([temporal].concat(cad).join(" "));
                    resultado.push(x);
                    skipTo = y; // se salta la palabra completa
                    x++;
                    break;
                  } else {
                    var cad2 = "";
                    var z = y + 1;
                    while(z < cArreglo.length && !(/^\s$/.test(cArreglo[z]))) {
                      cad2 += cArreglo[z];
                      z++;
                    }
                    if(cad2) {
                      if(new RegExp("^(" + reg[x] + ")$").test( [[temporal].concat(cad).join(" ")].concat(cad2).join(" ") )) {
                        tokens.push([[temporal].concat(cad).join(" ")].concat(cad2).join(" "));
                        resultado.push(x);
                        skipTo = z; // se salta la palabra completa
                        x++;
                        break;
                      }
                    }
                  }
                }
              }
              x++;
            } else {
              if(reg[x].test(temporal)) {
                tokens.push(temporal);
                resultado.push(x);
                x++;
                break;
              }
              x++;
            }
          }
          temporal = "";
        } else {
          temporal += character;
        }
      }

    });
    
    // se revisa el ultimo token
    while(x < reg.length) {
      if(x > 0 && x !== 1) { // en 1 estan ubicados los nombres
        if(reg[x].test(temporal)) {
          tokens.push(temporal);
          resultado.push(x);
          x++;
          break;
        }
        x++;
      } else {
        break;
      }
    }

    //console.log("TOKENS: " + chalk.yellow(tokens));
    //console.log("RESULTADO: " + chalk.yellow(resultado));

    if(expected.indexOf(resultado.toString()) === -1) {
      return false;
    } else {
      return true;
    }
  }

});

reader.addListener("end", function() {
  console.log(chalk.green("FIN DE LA LECTURA DEL ARCHIVO"));
});