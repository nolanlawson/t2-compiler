'use strict';

let express = require('express');
let db = require('./db');

// knex.select().table('packages').then(rows => {
//   console.log(rows);
// });


module.exports = function(opt){
  opt = opt || {};
  let port = opt.port || process.env.PORT || 3000;

  let app = express();
  app.set('view engine', 'hbs');
  app.use(express.static('public'));

  app.get('/', (req, res) => {
    db.Package.fetchAll().then((models) => {
      return JSON.stringify(models);
    }).then( (string) => {
      res.render('index', {name: string});
    });
  });

  app.listen(port, () => {
    console.log(`Listening on port http://0.0.0.0:${port}`);
  });
  return app;
};
