'use strict';

let db = require('knex')(require('../knexfile'));
let bookshelf = require('bookshelf')(db);

let Version = bookshelf.Model.extend({
  tableName: 'versions',
  package: function() {
    return this.belongsTo(Package)
  }
});

let Package = bookshelf.Model.extend({
  tableName: 'packages',
  versions: function() {
    return this.hasMany(Version);
  }
});

function findOrCreate(table, whereData, createData) {
  return db(table).select('id').where(whereData).then(rows => {
    if (rows.length){
      return rows[0].id;
    }
    return db(table).insert(createData || whereData).returning('id').then(ids => {
      return ids[0];
    });
  });
}

function addPackage(name, version, tarball) {
  let thePackage = new Package({name}).fetchOne({require: true}).catch(()=>{
    return new Package({name}).save();
  });

  return thePackage.tap(p => {
    return p.versions().query({version}).fetchOne().catch(()=>{
      return new Version({name, version, tarball, package_id: p.id}).save()
    });
  });
}

module.exports = {
  Package,
  Version,
  addPackage
};
