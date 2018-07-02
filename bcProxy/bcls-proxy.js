/*
* Author: Theresa Newman
* Derived from: https://gist.github.com/bcls/c9254c89313f4246d80f
* Description: Proxies Brightcove API requests, getting an access token, making the call, returning response
*/
var BCLSPROXY = (function () {
  'use strict'

  var winston = require('winston')
  var colors = require('colors')
  var http = require('http')
  var request = require('request')
  var path = require('path')
// error messages
  var apiError = 'Your API call was unsuccessful; here is what the server returned: '
  var oauthError = 'There was a problem getting your access token: '
  var originError = 'Your request cannot be processed; this proxy only handles requests originating from your domain.'
// holder for request options
  var options = {}
// pull based ingest api
  var diapiServer
  var diapiSettings = {}
  var diErrorCodes = {

  }
// cms api
  var cmsapiServer
  var cmsapiSettings = {}
  var cmsErrorCodes = {}
// cms api update
  var cmsapiUpdateServer
  var cmsapiUpdateSettings = {}
  var cmsErrorUpdateCodes = {}
  var diNotificationsServer
// functions
  var getFormValues
  var getAccessToken
  var sendRequest
  var isDefined
  var copyProps
  var init
  var logLevel = process.env.NODE_ENV
  var logFile = process.env.LOG_FILE
  var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.File)({
        filename: logFile,
        json: false,
        level: logLevel,
        maxsize: 10*1024*1024
      })
    ]
  })

/*
* initialize data constructs
*/
  init = function () {
    diapiSettings.token = null
    diapiSettings.expires_in = 0
    diapiSettings.clientId = null
    diapiSettings.clientSecret = null
    cmsapiSettings.token = null
    cmsapiSettings.expires_in = 0
    cmsapiSettings.clientId = null
    cmsapiSettings.clientSecret = null
    cmsapiUpdateSettings.token = null
    cmsapiUpdateSettings.expires_in = 0
    cmsapiUpdateSettings.clientId = null
    cmsapiUpdateSettings.clientSecret = null
// initialize options to null except requestType to GET
    options.url = null
    options.token = null
    options.clientId = null
    options.clientSecret = null
    options.expires_in = 0
    options.requestBody = null
    options.requestType = 'GET'
    logger.log('warn', 'init done. logLevel is: ', logLevel)
  }
/*
* copy properties from one object to another
*/
  copyProps = function (obj1, obj2) {
    var prop
    for (prop in obj1) {
      if (obj1.hasOwnProperty(prop)) {
        obj2[prop] = obj1[prop]
      }
    }
  }
  isDefined = function (v) {
    if (v !== '' && v !== null && v !== 'undefined' && v !== undefined) {
      return true
    }
    return false
  }
/*
* extract form values from request body
*/
  getFormValues = function (body, callback) {
// split the request body string into an array
    var valuesArray = body.split('&')
    var max = valuesArray.length
    var i
    var item
    var error = null
// reset options values
    options.url = null
    options.token = null
    options.clientId = null
    options.clientSecret = null
    options.expires_in = 0
    options.requestBody = null
    options.requestType = 'GET'
// now split each item into key and value and store in the object
    for (i = 0; i < max; i = i + 1) {
      item = valuesArray[i].split('=')
      options[item[0]] = item[1]
    }
// data fixes
// decode the URL and request body
    options.url = decodeURIComponent(options.url)
    logger.log('silly', 'Options in getFormValues', options)
// check for required values
    if (options.clientId === null || options.clientSecret === null || options.url === null) {
      error = 'Error: Empty id, secret and-or url'
      logger.log('error', 'Error with request in getFormValues', error)
    }
    if (error === null) {
      logger.log('debug', 'Options in getFormValues', options)
      callback(null)
    } else {
      logger.log('error', 'Error getting Form Values', error)
      callback(error)
    }
  }
/*
* get new access_token for other APIs
*/
  getAccessToken = function (callback) {
// base64 encode the ciient_id:clientSecret string for basic auth
    var authString = new Buffer(options.clientId + ':' + options.clientSecret).toString('base64')
    var bodyObj
    var now = new Date().valueOf()
    request({
      method: 'POST',
      url: 'https://oauth.brightcove.com/v3/access_token?grant_type=client_credentials',
      headers: {
        'Authorization': 'Basic ' + authString,
        'Content-Type': 'application/json'
      },
      body: 'grant_type=client_credentials'
    }, function (error, response, body) {
      if (error === null) {
// return the access token to the callback
        bodyObj = JSON.parse(body)
        options.token = bodyObj.access_token
        options.expires_in = now + bodyObj.expires_in * 1000
		logger.log('info', 'Token returned')
        logger.log('silly', 'The Token', options.token)
        callback(null)
      } else {
        logger.log('error', 'Error getting Access Token', error)
        callback(error)
      }
    })
  }
/*
* sends the request to the targeted API
*/
  sendRequest = function (callback) {
    var requestOptions = {}
    var makeRequest = function () {
      request(requestOptions, function (error, response, body) {
        if (error === null) {
			if (body) {
			  logger.log('silly', 'response headers sendRequest', response.headers)
			  logger.log('silly', 'body sendRequest', JSON.stringify(body))
			  logger.log('info', 'response status code in sendRequest', response.statusCode)
			  callback(null, response.headers, body)
			} else {
			  logger.log('error', 'Error sendRequest', 'body cannot be parsed as JSON')
			  error = 'body cannot be parsed as JSON'
			  callback(error)
			}
        } else {
          logger.log('error', 'Error sendRequest', error)
          callback(error)
        }
      })
    }
    var setRequestOptions = function () {
      requestOptions = {
        method: options.requestType,
        url: options.url,
        headers: {
          'Authorization': 'Bearer ' + options.token,
          'Content-Type': 'application/json'
        },
        body: options.requestBody
      }
      logger.log('debug', 'request options', options)
// make the request
      makeRequest()
    }
    if (options.token === null) {
      getAccessToken(function (error) {
        if (error === null) {
          setRequestOptions()
        } else {
          logger.log('error', 'Error getAccessToken', error)
          callback(error)
        }
      })
    } else {
// we already have a token; good to go
      setRequestOptions()
    }
  }
/*
* Dynamic Ingest API
*/
  diapiServer = http.createServer(function (req, res) {
    var body = ''
// for CORS - AJAX requests send host instead of origin
    var origin = (req.headers.origin || '*')
    var now = new Date().valueOf()
/* the published version of this proxy accepts requests only from
* domains that include "yourdomain" and "localhost"
* check on host as well as origin for AJAX requests
*/
    if (isDefined(req.headers.origin) && req.headers.origin.indexOf('yourdomain') < 0 && req.headers.origin.indexOf('localhost') < 0) {
      res.writeHead(
'500',
'Error',
        {
          'access-control-allow-origin': origin,
          'content-type': 'text/plain'
        }
)
      res.end(originError)
    } else if (isDefined(req.headers.host) && req.headers.host.indexOf('yourdomain') < 0 && req.headers.host.indexOf('localhost') < 0) {
      res.writeHead(
'500',
'Error',
        {
          'access-control-allow-origin': origin,
          'content-type': 'text/plain'
        }
)
      res.end('Your request cannot be processed; this proxy only handles requests originating from your domain.')
    }

    req.on('data', function (chunk) {
      body += chunk
    })
// handle data on query strings (AJAX requests)
    if (body === '') {
      body = req.url.substring(2)
    }
    req.on('end', function () {
      getFormValues(body, function (error) {
        if (error === null) {
          if (diapiSettings.clientId === options.clientId) {
            if (diapiSettings.expires_in > now) {
              options.token = diapiSettings.token
            }
          }
          sendRequest(function (error, headers, body) {
            if (error === null) {
			  if (JSON.parse(body)[0] && 'error_code' in JSON.parse(body)[0]) {
              logger.log('silly','body DI', JSON.parse(body))
              logger.log('info','response code DI', res.statusCode)
                //bc call successful but error code returned (40* response)
                // request failed, return api error
                res.writeHead(
                  400,
                  'Error', {
                    'access-control-allow-origin': origin,
                    'content-type': 'text/plain'
                  }
                )
                  logger.log('error', 'DI '+JSON.parse(body)[0].error_code , JSON.parse(body)[0].message)
                  res.end(JSON.parse(body)[0].error_code + ':' + JSON.parse(body)[0].message)
              } else {
                // request successful
                var header
                // save options to diapiSettings
                copyProps(options, diapiSettings)
                // return headers from the response
                for (header in headers) {
                  if (headers.hasOwnProperty(header)) {
                    res.setHeader(header, headers[header])
                  }
                }
                logger.log('debug','headers in diapiServer',JSON.stringify(headers))
                // return the body from the response
                res.writeHead(
                  '200',
                  'OK', {
                    'access-control-allow-origin': origin,
                    'content-type': 'text/plain',
                    'content-length': Buffer.byteLength(body, 'utf8')
                  }
                )
                res.end(body)
              }
            } else {
// request failed, return api error
              res.writeHead(
                '500',
                'Error', {
                  'access-control-allow-origin': origin,
                  'content-type': 'text/plain'
                }
              )
              res.end(apiError + error)
            }
          })
        } else {
          // there was no data or data was bad - redirect to usage notes
          res.statusCode = 302
          res.end()
        }
      })
    })
// change the following line to have the proxy listen for requests on a different port
  }).listen(8001)
  console.log('http server for Dynamic Ingest API '.blue + 'started '.green.bold + 'on port '.blue + '8001 '.yellow)
/*
* CMS API
*/
  cmsapiServer = http.createServer(function (req, res) {
    var body = ''
// for CORS - AJAX requests send host instead of origin
    var origin = (req.headers.origin || '*')
    var now = new Date().valueOf()
// the published version of this proxy accepts requests only from domains that include "yourdomain" and "localhost" check on host as well as origin for AJAX requests
    if (isDefined(req.headers.origin) && req.headers.origin.indexOf('yourdomain') < 0 && req.headers.origin.indexOf('localhost') < 0) {
      res.writeHead(
'500',
'Error',
        {
          'access-control-allow-origin': origin,
          'content-type': 'text/plain'
        }
)
      res.end(originError)
    } else if (isDefined(req.headers.host) && req.headers.host.indexOf('yourdomain') < 0 && req.headers.host.indexOf('localhost') < 0) {
      res.writeHead(
'500',
'Error',
        {
          'access-control-allow-origin': origin,
          'content-type': 'text/plain'
        }
)
      res.end('Your request cannot be processed; this proxy only handles requests originating from your domain.')
    }

    req.on('data', function (chunk) {
      body += chunk
    })
// handle data on query strings (AJAX requests)
    if (body === '') {
      body = req.url.substring(2)
    }
    req.on('end', function () {
      getFormValues(body, function (error) {
        if (error === null) {
          if (cmsapiSettings.clientId === options.clientId) {
            if (cmsapiSettings.expires_in > now) {
              options.token = cmsapiSettings.token
            }
          }
          sendRequest(function (error, headers, body) {
            if (error === null) {
              if (JSON.parse(body)[0] && 'error_code' in JSON.parse(body)[0]) {
              logger.log('silly','body CMS', JSON.parse(body))
              logger.log('info','response code CMS', res.statusCode)
                //bc call successful but error code returned (40* response)
                // request failed, return api error
                res.writeHead(
                  400,
                  'Error', {
                    'access-control-allow-origin': origin,
                    'content-type': 'text/plain'
                  }
                )
                  logger.log('error', 'CMS '+JSON.parse(body)[0].error_code , JSON.parse(body)[0].message)
                  res.end(JSON.parse(body)[0].error_code + ':' + JSON.parse(body)[0].message)
              } else {
                // request successful (200 response)
                var header
                // save options to cmsapiSettings
                copyProps(options, cmsapiSettings)
                // return headers from the response
                for (header in headers) {
                  if (headers.hasOwnProperty(header)) {
                    res.setHeader(header, headers[header])
                  }
                }
                // return the body from the response
                res.writeHead(
                  '200',
                  'OK', {
                    'access-control-allow-origin': origin,
                    'content-type': 'text/plain',
                    'content-length': Buffer.byteLength(body, 'utf8')
                  }
                )
                logger.log('silly','body in cmsapiServer', JSON.stringify(body))
                res.end(body)
              }
            } else {

            // request failed, return api error
            res.writeHead(
              '500',
              'Error', {
                'access-control-allow-origin': origin,
                'content-type': 'text/plain'
              }
            )
              logger.log('error', apiError, error)
              res.end(apiError + error)
            }
          })
        } else {
// there was no data or data was bad
          res.statusCode = 302
          res.end()
        }
      })
    })
// change the following line to have the proxy listen for requests on a different port
  }).listen(8002)
  console.log('http server for CMS API '.blue + 'started '.green.bold + 'on port '.blue + '8002 '.yellow)
// initialize
  init()
})()
