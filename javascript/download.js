var cmsUrl
var diUrl
var addToFolder
var addFolderUrl
var cmsVideoId
var isUpdate = false
var accountId
var clientId
var totalVideos
var clientSecret
var apiType
var logResponse
$(document).ready(function () {
// function to show the response
  logResponse = function (type, data) {
    $('#messageBox').append('<br>' + type + ': ' + data)
  }
  function updateStatus (current) {
    if (current < totalVideos - 1) {
      $('progress').attr('value', current + 1)
    } else {
      $('.progressBar').hide()
      $('#messageBox').append('<br><strong>' + totalVideos + ' videos processed</strong>').show()
      $('#diSubmit').show()
    }
  }
  $.getJSON('/config/accounts.config', function (json) {
    $.each(json, function (key, value) {
      $('select[name=selectAccountId]').append('<option value=' + JSON.parse(json[key].ID) + '>' + json[key].Account + '</option>')
    })
  })
.done(function (data) {
  var BCLS = (function (window, document) {
    var locationOrigin = location.protocol+'//'+location.hostname
    var cmsProxyURL = locationOrigin+':8002'
    var videoDataDisplay = document.getElementById('videoData')
    var diSubmit = document.getElementById('diSubmit')
    var diProxyURL = locationOrigin+':8001'
    var messageBox = document.getElementById('messageBox')
    var videoData = []
    var videoNumber = 0
    var t1
    var t2
    var t3
    // var isDefined
    // var cleanString
    var doIngest
    var submitRequest
    var setCMSOptions
    var setDIOptions
    // set options for the CMS API request
    setCMSOptions = function () {
      var options = {}
      var strRequestBody
      // truncate description if too long
      options.clientId = clientId
      options.clientSecret = clientSecret
      strRequestBody = '{"name":"' + videoData[videoNumber].name + '"'
      if (videoData[videoNumber].description) { strRequestBody += ',"description":"' + videoData[videoNumber].description.substr(0, 120) + '"'}
      if (videoData[videoNumber].long_description) { strRequestBody += ',"long_description":"' + videoData[videoNumber].long_description + '"'}
      if (videoData[videoNumber].reference_id) { strRequestBody += ',"reference_id":"' + videoData[videoNumber].reference_id + '"' }
      if (videoData[videoNumber].custom_fields) {
        //remove any escaping (google sheets escapes, excel does not)
        var customFieldsValue = JSON.stringify(videoData[videoNumber].custom_fields).replace(/\\/g, "")
        //remove outer quotes if they exist and replace with curly braces (google sheets wraps in quotes, excel does not)
        if (customFieldsValue.slice(0, 2) == '""') {
          customFieldsValue = customFieldsValue.substr(1).slice(0, -1)
          strRequestBody += ',"custom_fields":' + '{' + customFieldsValue + '}' 
        } else {
          strRequestBody += ',"custom_fields":' + customFieldsValue
        }
      }
      if (videoData[videoNumber].tags) {
        //remove any escaping (google sheets escapes, excel does not)
        var tagsValue = JSON.stringify(videoData[videoNumber].tags).replace(/\\/g, "")
        //remove outer quotes if they exist and replace with curly braces (google sheets wraps in quotes, excel does not)
        if (tagsValue.slice(0, 2) == '""') {
          tagsValue = tagsValue.substr(1).slice(0, -1)
          strRequestBody += ',"tags":' + '[' + tagsValue + ']' 
        } else {
          strRequestBody += ',"tags":' + tagsValue
        }
      }
      // if new vtt text_track file and text_track language are supplied, remove existing text_track
      // will upldate new text_track in DI call
      if (isUpdate && (videoData[videoNumber].text_tracks_url)) {
        strRequestBody += ',"text_tracks":[]'
      }
      strRequestBody += '}'
      if (videoData[videoNumber].folder_id) { 
        addToFolder = true
      } else {
        addToFolder = false
      }
      options.requestBody = strRequestBody
      // logResponse("debug", 'strRequestBody for video number(' + videoNumber + ') is '+ strRequestBody)
      if ((videoData[videoNumber].video_status === 'update') && (isUpdate === false)) {
      // to update video must use video id
      // initial use case was to identify videos by reference id
      //make first cms api call to get video id then change isUpdate to true
        options.requestType = 'GET'
        options.url = cmsUrl + '/videos' + '/ref:' + videoData[videoNumber].reference_id
        submitRequest(options, cmsProxyURL, 'getId')
      } else if (isUpdate) {
        options.requestType = 'PATCH'
        options.url = cmsUrl + '/videos' + '/' + cmsVideoId
        submitRequest(options, cmsProxyURL, 'cms')
      } else {
      // new video
        options.requestType = 'POST'
        options.url = cmsUrl + '/videos'
        submitRequest(options, cmsProxyURL, 'cms')
      }
      // logResponse('debug', 'cms options ' + JSON.stringify(options))
    }
    // set options for the Dynamic Ingest API request
    setDIOptions = function () {
	  if (videoData[videoNumber].url || videoData[videoNumber].text_tracks_url) {
		  var DiOptions = {}
		  DiOptions.clientId = clientId
		  DiOptions.clientSecret = clientSecret
		  DiOptions.requestBody = '{'
		  if (videoData[videoNumber].url) { DiOptions.requestBody += '"master":{"url":"' + videoData[videoNumber].url + '"}' }
		  if (videoData[videoNumber].url && videoData[videoNumber].text_tracks_url) {DiOptions.requestBody += ',' }
		  if (videoData[videoNumber].text_tracks_url) { DiOptions.requestBody += '"text_tracks":[{"url":"' + videoData[videoNumber].text_tracks_url + '","srclang":"' + videoData[videoNumber].text_tracks_srclang + '"}]' }
		  DiOptions.requestBody += '}'
		  DiOptions.requestType = 'POST'
		  DiOptions.url = diUrl
		  //logResponse('debug', 'di options ' + JSON.stringify(DiOptions))
		  submitRequest(DiOptions, diProxyURL, 'di')
	  } else {
		  //move on to next video if no master url or text track to update
		  isUpdate = false
		  if (videoNumber < totalVideos - 1) {
		    updateStatus(videoNumber)                      
		    videoNumber++
		    // logResponse('debug', 'apiType is di')                                
		    // pause to avoid CMS API timeouts
			t2 = setTimeout(setCMSOptions, 3000)
		  } else {
		    updateStatus(videoNumber)
		  }
	  }
    }
    // set options for the Dynamic Ingest API request
    setFolderOptions = function () {  
      var folderOptions = {}
      folderOptions.clientId = clientId
      folderOptions.clientSecret = clientSecret
      folderOptions.requestType = 'PUT'
      folderOptions.url = addFolderUrl
      // logResponse('debug', 'folder options ' + JSON.stringify(folderOptions))
      submitRequest(folderOptions, cmsProxyURL, 'folder')
    }    
    // function to submit Request
    submitRequest = function (options, proxyURL, apiType) {
      var httpRequest = new XMLHttpRequest()
      var requestData
      var responseData
      var parsedData
      var getResponse = function () {
        try {
          if (httpRequest.readyState === 4) {
            responseData = httpRequest.responseText
            if (httpRequest.status === 200) {
              switch (apiType) {
                case 'cms':
                  isUpdate = false
                  if ((responseData.indexOf('TIMEOUT') > 0) || (responseData.indexOf('RATE_LIMIT_EXCEEDED') > 0) || (responseData.indexOf('TOO_MANY_REQUESTS') > 0 )) {
                    // logResponse('debug', 'responseData ' + responseData)                     
                    t1 = setTimeout(setCMSOptions, 3000)
                  } else {
                    // logResponse('debug', 'apiType is cms')                     
                    parsedData = JSON.parse(responseData)
                    diUrl = 'https://ingest.api.brightcove.com/v1/accounts/' + accountId + '/videos/' + parsedData.id + '/ingest-requests'
                    setDIOptions()
                    if (addToFolder === true) {
                      addFolderUrl = cmsUrl + '/folders/'+ videoData[videoNumber].folder_id + '/videos/' + parsedData.id
                      t4 = setTimeout(setFolderOptions,3000)
                    }
                  }
                  break
                case 'di':
                  if ((responseData.indexOf('TIMEOUT') > 0) || (responseData.indexOf('RATE_LIMIT_EXCEEDED') > 0) || (responseData.indexOf('TOO_MANY_REQUESTS') > 0)) {
                    // logResponse('debug', 'responseData ' + responseData)                      
                    diUrl = options.url
                    setDIOptions()
                  } else {
                  // logResponse('debug', 'responseData ' + responseData)   
                  // logResponse("debug", JSON.stringify(options))             
                    isUpdate = false
                    if (videoNumber < totalVideos - 1) {
                      updateStatus(videoNumber)                      
                      videoNumber++
                      // logResponse('debug', 'apiType is di')                                
                      // pause to avoid CMS API timeouts
                        t2 = setTimeout(setCMSOptions, 3000)
                    } else {
                      updateStatus(videoNumber)
                    }
                    }
                  break
                case 'folder':                     
                  if (responseData.indexOf('NOT_FOUND') > 0) {    
                    logResponse('error', options.url+' failed due to invalid folder_id')  
                    // logResponse("debug", JSON.stringify(options)) 
                      break
                  } else {
                    isUpdate = false
                    addToFolder = false                  
                    break                  
                  }
                case 'getId':
                  // logResponse('debug', 'apiType is getId')                            
                  isUpdate = true
                  // when modifying a video get the video id from reference id
                  // and send back to setCMSOptions
                  parsedData = JSON.parse(responseData)
                  cmsVideoId = parsedData.id
                    t3 = setTimeout(setCMSOptions, 3000)
                  break
              }
            } else if (httpRequest.status === 400) {
              //append video error to message box
              logResponse('error', 'There was a problem with the video in row number '+(videoNumber+1)+': '+responseData)              
              //move on to the next
              isUpdate = false //reset isUpdate
              if (videoNumber < totalVideos - 1) {
                updateStatus(videoNumber)
                videoNumber++
                t2 = setTimeout(setCMSOptions, 3000)
              } else {
                updateStatus(videoNumber)
              }              
              //end of move on to the next

            } else {
              //500 error or connection failed - end it all
              logResponse('error', 'There was a problem connecting through proxy, make sure you are in network '+responseData)
              $('#messageBox').show()
              $('.progressBar').hide()
              $('#diSubmit').show()
            }
          }
        } catch (e) {
          logResponse('exception', 'Caught Exception: ' + e)
        }
      }
      // set up request data
      if (apiType === 'getId' || apiType === 'folder') {
        requestData = 'clientId=' + options.clientId + '&clientSecret=' + options.clientSecret + '&url=' + options.url + '&requestType=' + options.requestType
      } else {
        requestData = 'clientId=' + options.clientId + '&clientSecret=' + options.clientSecret + '&url=' + options.url + '&requestBody=' + options.requestBody + '&requestType=' + options.requestType
      };
      // logResponse('debug', 'setup requestData' + requestData)
      // set response handler
      httpRequest.onreadystatechange = getResponse
      // open the request
      httpRequest.open('POST', proxyURL)
      // set headers
      httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
      // logResponse('debug', "requestData "+requestData);
      // open and send request
      httpRequest.send(requestData)
    }
    diSubmit.addEventListener('click', function (e) {
      $('#submitError').hide()
      $('#messageBox').hide().html('')
      $('progress').attr('value', 0)
      if (($('#videoData').val() === '') || ($('select[name=selectAccountId]').val() === '') || ($('#clientId').val() === '') || ($('#clientSecret').val() === '')) {
        e.preventDefault()
        $('#submitError').text('All fields required').show()
      } else {
        e.preventDefault()
        try {
          videoData = JSON.parse(videoDataDisplay.value)
          accountId = $('select[name=selectAccountId]').val()
          clientId = $('#clientId').val()
          clientSecret = $('#clientSecret').val()
          totalVideos = videoData.length
          $('progress').attr('max', totalVideos)
          // in case of stop/start, reset videoNumber to 0
          videoNumber = 0
          cmsUrl = 'https://cms.api.brightcove.com/v1/accounts/' + accountId 
          $('#diSubmit').hide()
          $('.progressBar').show()
          setCMSOptions()          
        } catch (e) {
          console.log(e)
          $('#submitError').text('Invalid JSON').show()
          $(window).scrollTop($('#submitError').offset().top)
          $('#diSubmit').show()
          $('.progressBar').hide()
        }
      }
    }, false)
  })(window, document)
})
})
