'use strict';

var Consul = require("consul")
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var execute = require('ensemblejs/src/util/interval').execute;
var source = 'http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=distributedlife&api_key=8adfa182c97d9bf48bdcb0dd3fda5ca1&format=json';

module.exports = {
  type: 'GetStateAsync',
  deps: ['DefinePlugin', 'Logger'],
  func: function SyncSomeState (define, logger) {
    var state = {};
    var dirty = false;
    var consul = Consul({
      host: 'gandalf.ensemblejs.com',
      port: '8500'
    });

    define()('OnPhysicsFrame', function GetData () {

      function getConsulLeader(data) {
        return new Promise(function(resolve, reject) {
          consul.status.leader(function(err, result) {
            if (err) reject(err);
            data['consulLeaderIp'] = result.split(':')[0];
            resolve(data);
          });    
        });
      }

      function getConsulPeers(data) {
        return new Promise(function(resolve, reject) {
          consul.status.peers(function(err, result) {
            if (err) reject(err);
            data['consulPeerIps'] = result.map(function(val) { return val.split(':')[0] });
            resolve(data);
          });    
        });
      }

      function getDockerLeader(data) {
        return new Promise(function(resolve, reject) {
          consul.kv.get('nodes/docker/swarm/leader', function(err, result) {
            if (err) reject(err);
            data['dockerLeaderName'] = result['Value']
            resolve(data);
          });    
        });
      }

      function getNodes(data) {
        return new Promise(function(resolve, reject) {
          consul.catalog.node.list(function(err, result) {
            if (err) reject(err);
            data['nodes'] = result
            resolve(data);
          });    
        });
      }

      function getNodeHealthChecks(node) {
        return new Promise(function(resolve, reject) {
          consul.health.node(node, function(err, result) {
            if (err) reject(err);
            resolve(result);
          });
        });
      }

      function getHealthChecks(data) {
        return new Promise(function(resolve, reject) {
          
          var promises = [];
          data['nodes'].forEach(function(node) {
            promises.push(getNodeHealthChecks(node['Node']));
          });
          data['healthChecks'] = {}
          Promise.all(promises).then(function(dataArr) {
            dataArr.forEach(function(hc) {
              data['healthChecks'][hc[0]['Node']] = hc
            });
            resolve(data);
          }).catch(function(err) {
            reject(err);
          });
        });    
      }


      function sync() {
        getNodes({}).then(function(data) {
          return getHealthChecks(data);
        }).then(function(data) {
          return getDockerLeader(data);
        }).then(function(data) {
          return getConsulLeader(data);  
        }).then(function(data) {
          return getConsulPeers(data);  
        }).then(function(data) {
          state = {
            'wizards': [],
            'hobbits': []
          }
          data['nodes'].forEach(function(node) {
            if(data['consulPeerIps'].indexOf(node['Address'])) {
              state['wizards'].push({
                name: node['Node'],
                ip: node['Address'],
                healthChecks: data['healthChecks'][node['Node']]
              });
            } else if(data['consulLeaderIp'].indexOf(node['Address'])) {
              state['wizards'].push({
                name: node['Node'],
                ip: node['Address'],
                consulLeader: true,
                dockerLeader: true,
                healthChecks: data['healthChecks'][node['Node']]
              });
            } else {
              state['hobbits'].push({
                name: node['Node'],
                ip: node['Address'],
                healthChecks: data['healthChecks'][node['Node']]
              });
            }
          });

          dirty = true;
        }).catch(function(err) {
          logger().error("error");
          logger().error(err);
        });
      }

      return execute(sync).every(10).seconds();
    });

    define()('OnPhysicsFrame', function () {
      return function shareState () {
        if (!dirty) {
          return {};
        }
        // state['timestamp'] = Date.now();s
        dirty = false;
        logger().error(JSON.stringify(state));
        return {
          dashboard: state
        };
      };
    });

  }
};