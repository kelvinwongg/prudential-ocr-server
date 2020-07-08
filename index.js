// Express config
const express = require('express')
const app = express()
const port = 80

// Multer config
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })

// Tesseract-OCR config
const tesseract = require("node-tesseract-ocr")
const config = {
  lang: "eng",
  oem: 1,
  psm: 3,
}

// MySQL config
var mysql = require('mysql');
var connection = mysql.createConnection({
  // host     : 'localhost',
  // host     : 'host.docker.internal',
  host     : process.env.DBHOST,
  user     : 'root',
  password : 'root',
  database : 'prudential'
});
connection.connect()

// Handle Request
app.get('/', (req, res)=> { res.send('hello') })
app.post('/upload', upload.array('file', 12), function (req, res, next) {
  tesseract.recognize(req.files[0].path, config)
  .then(text => {
    // Record to database
    connection.query(mysql.format('INSERT INTO uploads (id, result ) VALUES (?, ?)', [req.files[0].filename, text]),
      function (error, results, fields) {
        if (error) { throw error }
      }
    )
    // Response in JSON
    res.json({ result: text.replace(/[^a-zA-Z ]/g, "") });
  })
  .catch(error => {
    console.log(error.message)
  })
})

process.on('exit', function () {
  connection.end()
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))