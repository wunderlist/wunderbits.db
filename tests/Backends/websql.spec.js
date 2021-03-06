describe('Backends/WebSQLBackend', function () {

  'use strict';

  // this suite is only for browsers that support WebSQL
  if (!('openDatabase' in global)) {
    return;
  }

  var WBDatabase = require('WBDatabase');
  var clone = require('wunderbits.core').lib.clone;

  var dbInstance;
  var dbOptions = { dbSize: 1024*1024 };

  var exampleTask = {'storeName': 'tasks', 'type':'Task','assignee_id':null,'completed':false,'starred':true,'note':'Note sldsdlkfj. sdlfkjsldkfj sldkfj sdf. sdlfkj sdflkj.','completed_at':null,'recurrence_type':'week','recurrence_count':1,'recurring_parent_id':null,'due_date':'2013-04-27','parent_id':null,'position':-10,'completed_by_id':null,'created_at':'2013-04-27T10:20:36Z','created_by_id':'AADDAABAAFE','deleted_at':null,'list_id':'inbox','owner_id':'AADDAABAAFE','title':'An example task with all attributes.','updated_at':'2013-04-27T10:23:58Z','user_id':'AADDAABAAFE','online_id':'ACDDABPTPqg','id':'lw6d6f126f6cd509b2046c29fd8573bf','hasSubtasks':true,'from_paste':true,'local_change':true};

  var dbName = 'specs-' + ~~(Math.random() * 10e4);
  var dbVersion = 10;

  beforeEach(function (done) {

    dbInstance = new WBDatabase({
      'schema': {
        'database': {
          'name': dbName,
          'version': dbVersion
        },
        'stores': {
          'tasks': {}
        }
      }
    });

    dbInstance.init('websql', dbOptions)
      .done(done)
      .fail(function () {
        throw new Error('Websql init failed');
      });
  });

  after(function () {

    dbInstance.backend.nuke();
  });

  describe('type conversions', function () {

    var taskData;

    beforeEach(function () {
      taskData = clone(exampleTask);
    });


    it('should not write/read JSON null as string "null"', function (done) {

      taskData.assignee_id = null;

      var read = function (task) {

        expect(task.assignee_id).to.equal(null);
        dbInstance.crud.delete('tasks', taskData).done(done);
      };

      var created = function () {

        dbInstance.crud.read('tasks', { 'id': taskData.id }).done(read);
      };

      dbInstance.crud.create('tasks', taskData).done(created);
    });

    it('should write/read "null" as string "null"', function (done) {

      taskData.title = 'null';

      var read = function (task) {

        expect(task.title).to.equal('null');
        dbInstance.crud.delete('tasks', taskData).done(done);
      };

      var created = function () {

        dbInstance.crud.read('tasks', { 'id': taskData.id }).done(read);
      };

      dbInstance.crud.create('tasks', taskData).done(created);
    });
  });

  describe('versioning', function () {

    this.timeout(10000);

    it ('should be upgradable', function (done) {

      var dbName = 'specs-upgrade-' + ~~(Math.random() * 10e4);
      var dbVersion = 10;

      var dbInstance = new WBDatabase({
        'schema': {
          'database': {
            'name': dbName,
            'version': dbVersion
          },
          'stores': {
            'lists': {}
          }
        }
      });

      dbInstance.init('websql', dbOptions)
        .done(function () {

          var newVersion = 11.1;

          var dbInstanceTwo = new WBDatabase({
            'schema': {
              'database': {
                'name': dbName,
                'version': newVersion
              },
              'stores': {
                'tasks': {
                  'fields': {
                    'bar': 'TEXT'
                  }
                }
              }
            }
          });

          var promise = dbInstanceTwo.init('websql', dbOptions);
          promise.done(function () {

              dbInstanceTwo.backend.listTables()
                .done(function (tables) {

                  expect(tables).to.contain('tasks');
                  expect(tables).to.not.contain('lists');
                  done();
                })
                .fail(function () {

                  done(new Error('Unable to list tables'));
                });
            })
            .fail(function () {
              throw new Error('Websql init failed');
            });
        })
        .fail(function () {
          throw new Error('Websql init failed');
        });
    });
  });
});