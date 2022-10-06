'use strict'

// Requeriment de dependencies
const express = require('express');
const ws = require('./socketio/index.js');
const http = require('http');
const GLBL = require('./config/general');

// Es crea la aplicació on es referencia amb la variable "app"
const app = express();

// Dins l'aplicació ens permet gestionar dades entrants com objectes JSON, nomès quan la petició es POST o PUT
app.use(express.json());

// inicialitzem el servidor
const server = http.createServer(app)
// conexió de sockets amb el servidor
ws.Socket_IO(server);


//peticiones.getDades(true);


// Aixequem el servidor
server.listen(GLBL.PORT, () => {
	log.info(`Servidor iniciat i escoltant en el port: ${GLBL.PORT} | http://localhost:${GLBL.PORT}`);
})