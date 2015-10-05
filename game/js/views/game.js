'use strict';

module.exports = {
  type: 'OnClientReady',
  deps: ['StateTracker', '$', 'Logger'],
  func: function MyView (tracker, $, logger) {

    function dashboard (state) { return state.dashboard; }


    function wizards (state) { return state.wizards; }
    function checks (state) { return state.checks; }



    // var template = require('../../views/partials/wizard.jade');
    var view = require('../../views/partials/wizards.jade');
    // var checkTemplate = require('../../views/partials/health_check.jade');
    // function update (dashboard) {
    //   logger().error(dashboard);
      
    //   // $()('#name').text(JSON.stringify(dashboard));
    //   // $()('#count').text(dashboard.count);
    //   $()('#wizards').empty();
    //   dashboard.wizards.forEach(function(wizard) {
    //     var html = template({name: wizard['name'], ip: wizard['ip'], consulLeader: wizard['consulLeader']});
    //     wizard['healthChecks'].forEach(function(check) {
    //       html('.health').append(checkTemplate({name: check['CheckId'], status: check['Status']}));
    //     });
    //     $()('#wizards').append(html);
    //   });
    // }

    function addWizard (wizard) {
      var template = require('../../views/partials/wizard.jade');
      $()('#wizards').append(template({id: wizard['name'], name: wizard['name'], ip: wizard.ip, consulLeader: wizard.consulLeader}));
    }

    function updateWizard (id, current, prior) {

    }

    function removeWizard (id, wizard) {
      $()('#' + wizard.name).remove();
    }

    function addCheck (check) {
      logger().warn('adding check');
      logger().warn(check);
      var template = require('../../views/partials/check.jade');
      $()('#' + check['node'] + ' .checks').append(template({id: check['id'], name: check['name'], status: check.status}));
    }

    function updateCheck (id, current, prior) {
      if(current.status == 'passing') {
        $()('#check-' + id).innerHTML = current['name'];
        // $()('#check-' + id).setAttribute('status', 'passing');
      }
    }

    function removeCheck (id, check) {
      $()('#check-' + id).remove();
    }


    return function setup () {
      // $()('#overlay').append(view());
      $()('#overlay').append(view());

      tracker().onElementAdded(wizards, addWizard, function(data){data.forEach(addWizard)});
      tracker().onElementChanged(wizards, updateWizard);
      tracker().onElementRemoved(wizards, removeWizard);

      tracker().onElementAdded(checks, addCheck, function(data){data.forEach(addCheck)});
      tracker().onElementChanged(checks, updateCheck);
      tracker().onElementRemoved(checks, removeCheck);
    };
  }
};