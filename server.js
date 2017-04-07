//1. definimos las dependencias de nuestro proyecto
const Hapi = require("hapi");
const Util = require("util");
const Fs = require("fs");
const Http = require("http");
const Request = require("request");
const Path = require("path");
const Stream = require('stream');
const RapidAPI = new require('rapidapi-connect');
const rapid = new RapidAPI('SmashTese', 'KEY DE RAPIDAPI');
let open = require('open');
const config = {
EMOTION_API_KEY: "KEY DE EMOTION API",
EMOTION_API_ENDPOINT: "https://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize"
}
//2.Instanciamos nuestro objeto server
const server = new Hapi.Server();
//3. Inicializamos los modulos
server.register(require("inert"), function (err) {
if (err)
trow("failed to load the plugin " + err);
});
//5. especificamos el puerto por el cual,nuestro objeto server atenderá las conexiones
server.connection({ port: process.env.port || 3000 }); 
//6. Definimos las rutas de nuestra app
server.route({
    path: "/", method: "GET", handler: {
        file: Path.join(__dirname, '/views') + "/index.html"
    }
});
//7.Contenido estatico de nuestro app (.css, .js, images etc)
server.route({
    path: "/public/{path*}", method: "GET", handler: {
        directory: { path: Path.join(__dirname, 'public'), listing: true }
    }
});
/*recibe una imagen enviada via post desde el cliente(front-end)
en formato base64, y realiza el request al api
de reconocimiento facial*/
server.route({
    path: "/detectfaces",
    method: "POST",
    config: {
//restricciones de archivo
        payload: {
            maxBytes: 1048576 * 50, /*50MB*/
            parse: true,         
        },
/*
        funcion que se ejecutará cada vez que una petición post al path /detectfaces
        sea realizada*/
handler: function (request, reply) {
//podemos obtener el buffer de la imagen si lo requerimos, de la siguiente forma
var base64Buffer = new Buffer(request.payload.image, "base64");
var binaryBuffer = new Buffer(base64Buffer.toString("binary"), "binary");
//generamos el request al api
var req = Request(
                {
                    url: config.EMOTION_API_ENDPOINT,//url de la api
                    method: 'POST',
                    headers: {                        
//formato de envío de la imagen al api
'Content-Type': 'application/octet-stream',
//tamaño del buffer
'Content-Length': binaryBuffer.length,
//suscription API KEY
'Ocp-Apim-Subscription-Key': config.EMOTION_API_KEY,
                    }
                }, function (error, response, body) {
if (error) 
reply(error); //en caso de que algo salga mal, retornamos al cliente el error
// si todo sale bien, devolvemos al cliente la respuesta del API
let respuesta = body.replace("[","").replace("]","")
respuesta = JSON.parse(respuesta);
console.log(respuesta.scores);
let emotionScore = 0;
  for (var key in respuesta.scores) {
    if (respuesta.scores[key] > emotionScore) {
      emotionScore = respuesta.scores[key];
      strongestEmotion = key;
      
    }
  }
console.log(strongestEmotion);
reply(body);

rapid.call('SpotifyPublicAPI', 'searchPlaylists', {
    'query': strongestEmotion,
    'market': '',
    'limit': '1',
    'offset': ''

  }).on('success', (payload) => {
       open(payload.playlists.items[0].external_urls.spotify);
  }).on('error', (payload) => {
       console.log("Error en el Query de Spotify");
  });
}).on('error', (payload) => {
  console.log("Error en Emotion API");





                });
/*creamos nuestro objeto stream a partir del buffer de la imagen y lo atachamos
            /al cuerpo de la petici'on*/
var bufferStream = new Stream.PassThrough();
bufferStream.end(binaryBuffer);
bufferStream.pipe(req);          
        }
    }
});
//ejecutamos nuestro server
server.start(function (err) {
if (err) { throw err; } console.log('Server running at:', server.info.uri);
});
