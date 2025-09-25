const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { io: ioClient } = require('socket.io-client');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');

const app = express();

const server = http.createServer(app);
const io = socketIO(server);

//Needed for nfc app
const WebSocket = require("ws");




//Used for determining servers local ip address
const networkInterfaces = os.networkInterfaces();
const addresses = [];

//Serve local files from the project directory
const staticPath = path.join(__dirname, '/');
app.use(express.static(staticPath));


//Database stuff

// Connect to the SQLite database
const db = new sqlite3.Database('db/database.db');

function initDatabaseTable(tableName, tableFields, tableRoute) {

  db.run(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ${tableFields}
      )
    `, error => {
      if (error) {
        console.error('Error creating table:', error.message);
      } else {
        console.log(`Table "${tableName}" created or already exists`);
      }
  });

  //Route to fetch data from the table
  app.get(`/${tableRoute}`, (req, res) => {
        db.all(`SELECT * FROM ${tableName}`, (error, rows) => {
          if (error) {
            console.error('Error reading data:', error.message);
            res.status(500).send('Error reading data');
          } else {
            res.json(rows);
          }
        });
  });

}

//Initialize the database tables
const analyticsFields = `action TEXT`
const leaderboardFields = `name TEXT, level TEXT, time TEXT, score TEXT, gametype TEXT, timestamp TEXT`

initDatabaseTable('analytics', analyticsFields, 'analytics')
initDatabaseTable('leaderboard', leaderboardFields, 'leaderboard')




// Start the server
const port = 3001;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Iterate over network interfaces
Object.keys(networkInterfaces).forEach(interfaceName => {
  const interfaces = networkInterfaces[interfaceName];

  // Iterate over addresses of the current network interface
  interfaces.forEach(interfaceInfo => {
    if (interfaceInfo.family === 'IPv4' && !interfaceInfo.internal) {
      addresses.push(interfaceInfo.address);
    }
  });
});

//console.log('Local IP addresses:', addresses);
console.log('----------------------')
console.log(`To access from other devices on the same local network, connect to:`);
console.log(`http://${addresses}:${port}`)
console.log('----------------------')




//Listen on 3000 for NFC stuff
const portNFC = 3000
const ws = new WebSocket(`ws://localhost:${portNFC}/text`);

ws.on("open", () => {
  console.log(`Connected to NFC app (${portNFC})`);
});

// Listen for broadcasts from NFC app
ws.on("message", (data) => {
  const formattedData = data.toString()
  console.log("Received from server:", formattedData);

  sendCommand('newGame','',formattedData) 
});
ws.on("close", (code, reason) => {
  console.log(`Connection closed (code: ${code}, reason: ${reason})`);
});

ws.on("error", (err) => {
  console.error("WebSocket error:", err);
});




// Handle WebSocket connections
io.on('connection', socket => {
    console.log('A user connected');
    console.log(socket.id)

    // Handle incoming WebSocket messages
    socket.on('message', data => {
        console.log('Received message:', data);
        
        if (data.action == "addToLeaderboard") {     
          writeToDatabase('leaderboard', data.data.fields, data.data.values)
        }   

        if (data.action == "addToTable") {     
          writeToDatabase(data.data.table, data.data.fields, data.data.values)
        }   
    });

    // Handle disconnections
    socket.on('disconnect', () => {
        console.log('A user disconnected');  
    });
});






//-----------------------------Helper functions---------------------------

function sendCommand(command,id,data) {
    let message = {
       "action":command,
       "id": id,
       "data":data
    }
    io.emit('message', message);     
  }
  
  


  
  function writeToDatabase(tableName, tableFields, tableValues) {

    tableName = tableName.replaceAll('/','')

    const fieldsArray = tableFields.split(',').map(f => f.trim());
    const idIndex = fieldsArray.indexOf('id');
  
    if (idIndex !== -1 && tableValues[idIndex]) {
      // Build UPDATE query
      const updateFields = fieldsArray
        .filter((_, i) => i !== idIndex) // skip 'id'
        .map(field => `${field} = ?`)
        .join(', ');
  
      const updateValues = fieldsArray
        .filter((_, i) => i !== idIndex) // skip 'id'
        .map((_, i) => tableValues[i + (i >= idIndex ? 1 : 0)]); // shift index if after id
  
      const rowId = tableValues[idIndex];
      updateValues.push(rowId); // id for WHERE clause
  
      const sql = `UPDATE ${tableName} SET ${updateFields} WHERE id = ?`;
  
      const cleanValues = updateValues.map(value => value === undefined ? null : value);

      console.log("Running SQL UPDATE:");
      console.log(sql);
      console.log("With values:", cleanValues);

  
      db.run(sql, cleanValues, function(err) {
        if (err) {
          console.error("DB Error:", err);
        } else {
          console.log(`Row updated (ID: ${rowId})`);
        }
      });
  

      } else {

        let len = tableFields.split(',').length
        let def = ""
        for (let i = 0; i < len; i++) {
        def = def + '?, ' 
        }
        def = def.slice(0, -2);
    
        console.log(`logging ${tableValues} to table ${tableName}`)
    
        db.run(`INSERT INTO ${tableName} (${tableFields}) VALUES (${def})`, tableValues );
    }

}

