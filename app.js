const express = require('express')
const app = express()
const path = require('path')

app.use('/jquery', express.static(__dirname + '/node_modules/jquery/'));
app.use('/css', express.static(__dirname + '/css/'));
app.use('/javascript', express.static(__dirname + '/javascript/'));
app.use('/config', express.static(__dirname + '/config/'));

app.use(express.static(__dirname+'/views'));

app.listen(3000, function() { console.log('listening')});