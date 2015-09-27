'use strict';

var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var execute = require('ensemblejs/src/util/interval').execute;
var source = 'http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=distributedlife&api_key=8adfa182c97d9bf48bdcb0dd3fda5ca1&format=json';

module.exports = {
  type: 'GetStateAsync',
  deps: ['DefinePlugin'],
  func: function SyncSomeState (define) {
    var state = {};
    var dirty = false;

    define()('OnPhysicsFrame', function GetData () {
      function sync () {
        request(source).spread(function (response, body) {
          var json = JSON.parse(body);

          state = {
            name: json.user.realname,
            count: json.user.playcount
          };

          dirty = true;
        });
      }

      return execute(sync).every().minute();
    });

    define()('OnPhysicsFrame', function () {
      return function shareState () {
        if (!dirty) {
          return {};
        }

        dirty = false;

        return {
          dashboard: state
        };
      };
    });

  }
};