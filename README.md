# Brightcove Bulk Upload
A node JS based app to replace Brightcove's deprecated FTP upload.

## The Tech
* [Git](http://git-scm.com/) for source controlling.
* [Node JS](http://nodejs.org/) for HTTP serving and server JS moduling.
* [Express JS](https://expressjs.com/) application framework
* [Brightcove APIs] (https://support.brightcove.com/getting-started-brightcove-apis) Brightcove APIs
* [Node Package Manager](https://npmjs.org/) for server JS package managing.
* [Docker](https://www.docker.com/) CaaS platform
* [Jenkins] (https://jenkins.io/) to deploy



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
6)  Edit files within repo

### Local setup using docker
1)  Clone repo
2)  Obtain copy of task_definition.json from the aws Int server kept in [box](https://hmhco.app.box.com/folder/37750805375)
3)  Copy task_definition.json to local_config folder
4)  At command line cd to repo
5)  Create env.list file for build by running `node ./local_config/create_env_list.js` 
6)  env.list is saved to local_config folder
7)  To build image run `docker build .`
8)  If successful you will see `Successfully built xxxxxxxxxxxx`  Where xxxxxxxxxxxx is the Image Id
9)  To run pass port mapping and environment variables: `docker run -p 80:3000 -p 8002:8002 -p 8001:8001 -e DEBUG_LEVEL=silly --env-file ./local_config/env.list  xxxxxxxxxxxx`
10) Logs will synch to logentries 
11) To view logs locally run apt-get install vim, navigate to container `docker exec -it CONTAINER_ID bash` then cd to /var/logs/videoupload to find logs
12) To edit files use vim and edit files in videoupload folder