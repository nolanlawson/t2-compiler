'use strict';

let changes = require('concurrent-couch-follower');
let checkForGypFile = require('./check-for-gyp');

let gypPackages = [];

function savePackageInfo(doc) {
  let name = doc.name;
  let version = doc['dist-tags'] && doc['dist-tags'].latest;

  gypPackages.push(doc);
  console.log('binding.gyp detected', name + '@' + version);
  console.log(gypPackages.length, 'packages detected with binding.gyp');
}

function logReject(error) {
  console.error(error);
}

function listenForChanges() {
  changes((data, done) => {
    let doc = data.doc;
    console.error('Processing ' + doc.name);
    checkForGypFile(doc).then(savePackageInfo, logReject).then(done);
  }, {
    db: 'https://skimdb.npmjs.com/registry',
    include_docs: true,
    sequence: '.sequence',
    concurrency: 20
  });
}

// listenForChanges();

module.exports = function(opt){

};
