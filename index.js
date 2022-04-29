const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const OrientDBClient = require("orientjs").OrientDBClient;

async function conectarBD() {
  let client = await OrientDBClient.connect({
    host: "localhost",
    port: 2424
  });
  console.log("Client Opened");
  
  let session = await client.session({ name: "CBD", username: "root", password: "root" });
  console.log("Session Opened");

  // Aquí se abre la sesion
  
  try {
    // let result = await session.query("select from OUser where name = :name", {params: { name: "admin" }})
    let result = await session.query("SELECT name, apellido FROM #11:0")
    // let result = await session.command("CREATE VERTEX V SET name='Antonio', apellido='Biñuela'")
      .all();
    console.log(result);
  } catch (err) {
    console.log(err);
  }
  
  // Aquí se cierra la sesión
  await session.close();
  console.log("Session Closed");
  await client.close();
  console.log("Client Closed");
}

const app = express();

// Middleware
app.use(morgan('tiny'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.set('puerto', process.env.PORT || 3000);
app.listen(app.get('puerto'), function () {
  console.log('Example app listening on port: '+ app.get('puerto'));
});

conectarBD()