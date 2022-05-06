const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const res = require('express/lib/response');
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
    const fs = require('fs');
    
    // ARTIST
    
    let file = fs.readFileSync(path.join(__dirname, 'Dataset LastFM/artists.dat'), 'utf8')
    await session.command(`DROP CLASS Artist UNSAFE`)
    await session.command(`CREATE CLASS Artist EXTENDS V`)
  
    for (let [index, line] of file.split("\n").entries()) {
      if (index !== 0) {
        let lineSplit = line.split("\t")
        let id = lineSplit[0]
        let name = lineSplit[1].replace(/\"+/gm, "'").replace(/\\+/gm, "\\\\")
        let url = lineSplit[2].replace(/\"+/gm, "'").replace(/\\+/gm, "\\\\")
        let pictureURL = lineSplit[3].replace(/\"+/gm, "'").replace(/\\+/gm, "\\\\")

        console.log(`Line: ${id}, ${name}, ${url}, ${pictureURL}`)
        let result = await session.command(`INSERT INTO Artist SET id="${id}", name="${name}", url="${url}", pictureURL="${pictureURL}"`).all()
      }
    }

    console.log("Artists inserted")

    // USER
    
    file = fs.readFileSync(path.join(__dirname, 'Dataset LastFM/users.dat'), 'utf8')
    await session.command(`DROP CLASS User UNSAFE`)
    await session.command(`CREATE CLASS User EXTENDS V`)
  
    for (let [index, line] of file.split("\r\n").entries()) {
      if (index !== 0) {
        let id = line

        console.log(`Line: ${id}`)
        let result = await session.command(`INSERT INTO User SET id="${id}"`).all()
      }
    }

    console.log("Users inserted")

    // USER_FRIENDS
    
    file = fs.readFileSync(path.join(__dirname, 'Dataset LastFM/user_friends.dat'), 'utf8')
    await session.command(`DROP CLASS Friend UNSAFE`)
    await session.command(`CREATE CLASS Friend EXTENDS E`)
  
    for (let [index, line] of file.split("\r\n").entries()) {
      if (index !== 0) {
        let lineSplit = line.split("\t")
        let userId = lineSplit[0]
        let friendId = lineSplit[1]

        console.log(`Line: ${userId}, ${friendId}`)
        let result = await session.command(`CREATE EDGE Friend FROM (SELECT FROM User WHERE id="${userId}") TO (SELECT FROM User WHERE id="${friendId}")`).all()
      }
    }
    
    console.log("User's friendship inserted")

    // USER_ARTISTS
    
    file = fs.readFileSync(path.join(__dirname, 'Dataset LastFM/user_artists.dat'), 'utf8')
    await session.command(`DROP CLASS Listen UNSAFE`)
    await session.command(`CREATE CLASS Listen EXTENDS E`)
  
    for (let [index, line] of file.split("\r\n").entries()) {
      if (index !== 0) {
        let lineSplit = line.split("\t")
        let userId = lineSplit[0]
        let artistId = lineSplit[1]
        let listeningCount = lineSplit[2]

        console.log(`Line: ${userId}, ${artistId}, ${listeningCount}`)
        let result = await session.command(`CREATE EDGE Listen FROM (SELECT FROM User WHERE id="${userId}") TO (SELECT FROM Artist WHERE id="${artistId}") SET listeningCount=${listeningCount}`).all()
      }
    }
    
    console.log("User's artists inserted")

    // TAGS
    
    file = fs.readFileSync(path.join(__dirname, 'Dataset LastFM/tags.dat'), 'utf8')
    await session.command(`DROP CLASS Tag UNSAFE`)
    await session.command(`CREATE CLASS Tag EXTENDS V`)
  
    for (let [index, line] of file.split("\r\n").entries()) {
      if (index !== 0) {
        let lineSplit = line.split("\t")
        let id = lineSplit[0]
        let value = lineSplit[1]

        console.log(`Line: ${id}, ${value}`)
        let result = await session.command(`INSERT INTO Tag SET id="${id}", value="${value}"`).all()
      }
    }

    console.log("Tags inserted")

    // TAGGED_ARTISTS
    
    file = fs.readFileSync(path.join(__dirname, 'Dataset LastFM/taggedartists.dat'), 'utf8')
    await session.command(`DROP CLASS Tagged UNSAFE`)
    await session.command(`CREATE CLASS Tagged EXTENDS E`)
  
    for (let [index, line] of file.split("\r\n").entries()) {
      if (index !== 0) {
        let lineSplit = line.split("\t")
        let artistId = lineSplit[0]
        let tagId = lineSplit[1]

        console.log(`Line: ${artistId}, ${tagId}`)
        let result = await session.command(`CREATE EDGE Tagged FROM (SELECT FROM Artist WHERE id="${artistId}") TO (SELECT FROM Tag WHERE id="${tagId}")`).all()
      }
    }
    
    console.log("Artists' tags inserted")

  } catch (err) {
    console.log("Error: " + err);
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