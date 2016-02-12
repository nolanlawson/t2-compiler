'use strict';

exports.up = function(knex, Promise) {

  let createPackages = knex.schema.createTable('packages', table => {
    table.increments();
    table.string('name').notNullable().unique();
  });

  let createVersions = knex.schema.createTable('versions', table => {
    table.increments();
    table.integer('package_id')
      .notNullable()
      .references('id')
      .inTable('packages')
      .onDelete('CASCADE');
    table.string('version').notNullable();
    table.enu('status',[
      'pending',
      'no binary',
      'binary',
      'built',
      'failed build'
    ]).notNullable().defaultTo('pending');
    table.text('tarball').notNullable();
    table.text('output');
    table.timestamps();

    table.unique(['package_id', 'version']);
  });

  let createConfig = knex.schema.createTable('config', table => {
    table.string('name').notNullable().unique();
    table.json('value').notNullable();
  });

  return Promise.all([
    createVersions,
    createPackages,
    createConfig
  ]);
};

exports.down = function(knex, Promise) {
  let packagesThenVersions = knex.schema.dropTable('versions').then(()=>{
    return knex.schema.dropTable('packages');
  });

  return Promise.all([
    packagesThenVersions,
    knex.schema.dropTable('config')
  ]);
};
