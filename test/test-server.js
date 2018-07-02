var chai = require('chai');
var chaiHttp = require('chai-http');
var app = require('../app');

var expect = chai.expect;

chai.use(chaiHttp);

process.env.NODE_ENV = 'test'

describe('Access cms api server at 8001', function() {
  it ('responds with status 200', function(done) {
    chai.request(app)
      refid = ????
      .get('http://localhost:8001/videos/ref:'+refid)
  });
});

describe('Test oauth to get Token', function() {
/*   var authString = new Buffer('5e93bc14-2096-4ac0-b602-acfef83bb42b:qiJlPUpk0rViscsmNlpvAdyw2QOW3a6IG3pzdStBAiC6HcIdDkWS1q1-Xg0UaFuebV-gcmGlrVWUsAxY9L644g').toString('base64')
  console.log(authString)
  it('responds with status 200', function(done) {
    chai.request(app)
      .post('https://oauth.brightcove.com/v3/access_token?grant_type=client_credentials')
      .set('Authorization', 'Basic ' + authString)
      .set('Content-Type', 'application/json')	 
      .set('body', 'grant_type=client_credentials')
      .end(function(err, res) {
        console.log(err)
        console.log('____')
        console.log(res)
        expect(res).to.have.status(200);
        done();
      });
  });   */
  
  
/*   var authString = new Buffer('5e93bc14-2096-4ac0-b602-acfef83bb42b:qiJlPUpk0rViscsmNlpvAdyw2QOW3a6IG3pzdStBAiC6HcIdDkWS1q1-Xg0UaFuebV-gcmGlrVWUsAxY9L644g').toString('base64')
  var token = '';
  it('should return an oauth token', function(done) {
    chai.request(app)
      .post('https://oauth.brightcove.com/v3/access_token?grant_type=client_credentials')
      .set('Authorization', 'Basic ' + authString)
      .set('Content-Type', 'application/json')	  
      .end(function(err, res) {
        console.log(res.body[0]);
        var result = JSON.parse(res.body[0]);
        token = result.access_token;
        done();
      });
  }); */
/*   before(function(done) {
    request(app)
      .post('https://oauth.brightcove.com/v3/access_token?grant_type=client_credentials')
	  .set('Authorization': 'Basic ' + authString)
	  .set('Content-Type': 'application/json')	  
      .end(function(err, res) {
        var result = JSON.parse(res.text);
        token = result.token;
        done();
      });
  }); */

/*   it('should not be able to consume the route /test since no token was sent', function(done) {
    request(app)
      .post('/test')
      .expect(401, done);
  });


  it('should be able to consume the route /test since token valid was sent', function(done) {
    request(app)
      .post('/test')
      .set('Authorization', 'Bearer ' + token)
      .expect(200, done);
  }); */
});