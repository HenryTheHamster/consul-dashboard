'use strict';

module.exports = {
  type: 'OnClientReady',
  deps: ['StateTracker', '$', 'Logger'],
  func: function MyView (tracker, $, logger) {

    function dashboard (state) { return state.dashboard; }
    var template = require('../../views/partials/wizard.jade');
    function update (dashboard) {
      logger().error(dashboard);
      
      // $()('#name').text(JSON.stringify(dashboard));
      // $()('#count').text(dashboard.count);
      dashboard['wizards'].forEach(function(wizard) {
        $()('#overlay').append(template({name: wizard['name'], ip: wizard['ip']}));
      });
    }

    var view = require('../../views/partials/lastfm.jade');

    return function setup () {
      // $()('#overlay').append(view());

      tracker().onChangeOf(dashboard, update);
    };
  }
};