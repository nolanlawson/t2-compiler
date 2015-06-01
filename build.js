var Promise = require('bluebird');
var quote = require('shell-quote').quote;
var parse = require('shell-quote').parse;
var spawn = require('child_process').spawn;
var df = require('date-format');
var fs = require('fs');
var mkdirp = require('mkdirp');
var expandTilde = require('expand-tilde');

var BINARIES_PATH = expandTilde('~/.tessel/binaries');

function pexec (str, opts) {
  opts = opts || {};
  var p = spawn(parse(str).shift(), parse(str).slice(1));
  var prom = new Promise(function (resolve, reject) {
    if (opts.silent !== true) {
      p.stdout.pipe(process.stderr);
      p.stderr.pipe(process.stderr);
    }
    p.on('exit', function (code) {
      code ? reject(code) : resolve();
    })
  })
  prom.stdout = p.stdout;
  prom.stdin = p.stdin;
  prom.stderr = p.stderr;
  prom.pipe = function (B) {
    p.stdout.pipe(B.stdin);
    return B;
  }
  return prom;
}

function vmexec (str, opts) {
  return pexec('sshpass -p "tcuser" ssh tc@localhost -p 4455 ' + quote([str]), opts);
}

function awaitSSH () {
  // Poll every second for a response from uname -a
  return new Promise(function loop (resolve, reject) {
    vmexec('uname -a')
    .then(function success () {
      resolve();
    }, function error () {
      Promise.resolve()
      .delay(1000)
      .then(function () {
        setImmediate(loop, reject, resolve);
      })
    })
  });
}

function launch () {
  return pexec('VBoxManage controlvm t2-compile poweroff', {
    silent: true,
  })
  .catch(function () {
    // noop
  })
  .then(function () {
    return pexec('VBoxManage startvm t2-compile --type headless');
  })
  .then(function () {
    console.error('Waiting to connect over SSH...');
    return awaitSSH();
  })
}

function build () {
  console.error('Uploading package...');
  return pexec('tar cf - --exclude .git --exclude node_modules .', {
    silent: true
  })
  .pipe(vmexec('cat > /tmp/t2-build-input.tar.gz', {
    silent: true
  }))
  .then(function () {
    var date = df.asString('yyMMddhhmm.ss', new Date(Date.now()+new Date().getTimezoneOffset()*60*1000));
    return vmexec('sudo date --set="' + date + '"')
  })
  .then(function () {
    console.error('Running build script...');
    var ret = vmexec('');
    fs.createReadStream(__dirname + '/build-remote.sh').pipe(ret.stdin);
    return ret;
  })
  .then(function () {
    // cat test.sh | sshpass -p 'tcuser' ssh tc@localhost -p 4455
    mkdirp.sync(BINARIES_PATH);

    return vmexec('cat /tmp/t2-build.tar.gz', {
      silent: true
    })
    .pipe(pexec('tar -xjf - -C ' + BINARIES_PATH, {
      silent: true
    }))
  })
}

function terminate () {
  return pexec('VBoxManage controlvm t2-compile poweroff')
  .then(function () {
    console.error('Done.');
  })
}

exports.launch = launch;
exports.build = build;
exports.terminate = terminate;
