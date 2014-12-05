var url = require('url')
  , https = require('https');

exports.getService = function(name) {
  // There are many useful environment variables available in process.env.
  // VCAP_APPLICATION contains useful information about a deployed application.
  var appInfo = JSON.parse(process.env.VCAP_APPLICATION || "{}");

  // defaults for dev outside bluemix
  var service_url = '<service_url>';
  var service_username = '<service_username>';
  var service_password = '<service_password>';

  // VCAP_SERVICES contains all the credentials of services bound to
  // this application. For details of its content, please refer to
  // the document or sample of each service.
  if (process.env.VCAP_SERVICES) {
    console.log('Parsing VCAP_SERVICES');
    var services = JSON.parse(process.env.VCAP_SERVICES);
    //service name, check the VCAP_SERVICES in bluemix to get the name of the services you have
    var service_name = name;

    if (services[service_name]) {
      var svc = services[service_name][0].credentials;
      service_url = svc.url;
      service_username = svc.username;
      service_password = svc.password;
    } else {
      console.log('The service '+service_name+' is not in the VCAP_SERVICES, did you forget to bind it?');
    }

  } else {
    console.log('No VCAP_SERVICES found in ENV, using defaults for local development');
  }

  console.log('service_url = ' + service_url);
  console.log('service_username = ' + service_username);
  console.log('service_password = ' + new Array(service_password.length).join("X"));

  var auth = "Basic " + new Buffer(service_username + ":" + service_password).toString("base64");

  request = function(method, version, entity, dataset, data, cb) {
    var parts = url.parse(service_url +'/v'+version+'/'+entity+'/'+dataset);
    var options = {
      host: parts.hostname,
      port: parts.port,
      path: parts.pathname,
      method: method,
      headers: {
        'Content-Type'  :'application/json',
        'Accept':'application/json',
        'X-synctimeout' : '30',
        'Authorization' :  auth
      }
    };

    var req = https.request(options, function(result) {
      result.setEncoding('utf-8');
      var response_string = '';

      result.on('data', function(chunk) {
        response_string += chunk;
      });

      result.on('end', function() {
        var result = JSON.parse(response_string)[0];
        cb(null,result);
      });
    });

    req.on('error', function(e) {
      return cb(e);
    });

    req.write(JSON.stringify(data));
    req.end();

  }

  return { request: request };
}

