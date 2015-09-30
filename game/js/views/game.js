'use strict';

module.exports = {
  type: 'OnClientReady',
  deps: ['StateTracker', '$'],
  func: function MyView (tracker, $) {

    function dashboard (state) { return state.dashboard; }

    function update (dashboard) {
      
      $()('#name').text(JSON.stringify(dashboard));
      // $()('#count').text(dashboard.count);
    }

    var view = require('../../views/partials/lastfm.jade');

    return function setup () {
      $()('#overlay').append(view());

      tracker().onChangeOf(dashboard, update);
    };
  }
};