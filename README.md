# Brightcove Bulk Upload
A node JS based app to replace Brightcove's deprecated FTP upload.

## The Tech
* [Git](http://git-scm.com/) for source controlling.
* [Node JS](http://nodejs.org/) for HTTP serving and server JS moduling.
* [Express JS](https://expressjs.com/) application framework
* [Brightcove APIs] (https://support.brightcove.com/getting-started-brightcove-apis) Brightcove APIs
* [Node Package Manager](https://npmjs.org/) for server JS package managing.

### Environmental Settings

This app is using Winston for logging which interacts with the npm logging levels:
{ error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }

The maximum level of messages that winston logs is determined by NODE_ENV in bcls-proxy.js.

NODE_ENV is set by passing DEBUG_LEVEL arg to docker e.g. in docker run command add: -e DEBUG_LEVEL=silly (will show everything but silly messages)

### Local setup without docker
1)  Clone repo
2)  At command line cd to repo
3)  Run `NODE_ENV=silly LOG_FILE='log/bcls-proxy.log' npm start`
4)  If successful you will see messages showing servers running on port 8001 and 8002
5)  Access site in browser at localhost:3000
