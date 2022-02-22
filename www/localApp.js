var exec = require('cordova/exec');

var LocalApp = {
    navigateToUrl: function (filePath) {
        exec(null, null, 'LocalApp', 'navigateToUrl', [filePath]);
    }
};

module.exports = LocalApp;
