module.exports = function(grunt){
    "use strict";
    var path = require('path'),
        fs = require('fs'),

        deleteMountPoint = function(folder){

        // need to fs.unlink directly on windows because
        // the grunt.file.delete method doesn't recognise symlinks!
        if(process.platform === 'win32'){
            fs.unlinkSync(folder);
        } else {
            grunt.file.delete(folder, {force: true});
        }
    };

    /*
    var optionsSample = {
      windows: {
        driveLetter: "X"
      },
      '*nix': {
        // options common to linux, mac os
        fileSystem: "smbfs",
      },
      share: {
        host: "my.server.com",
        folder: "/path/on/server"  // can be /path/to/share or \path\to\share, will be normalised
      },
      mountPoint: "./share",       // path to the folder, can be path/to/folder or path\to\folder
      username: "username",
      password: "password"
    };
     */



    grunt.registerMultiTask('mount', 'mount a network share', function(){

        var options = '',
            commandBuilder = '',
            command = '',
            map = '';

        //Load options either from file or task
        if (grunt.file.exists('_mapDrive.json')) {

            map = grunt.file.readJSON('_mapDrive.json');
            
            options = this.options({
                        windows: {
                            driveLetter: map.windowDriveLetter
                        },
                        '*nix': {
                            // options common to linux, mac os
                            fileSystem: map.nixFileSystem,
                        },
                        share: {
                            host: map.shareHost,
                            folder: map.shareFolder  // can be /path/to/share or \path\to\share, will be normalised
                        },
                        mountPoint: map.mountPoint,       // path to the folder, can be path/to/folder or path\to\folder
                        username: map.username,
                        password: map.password,
                    });

        }

        if (options.mount) {
            options.createMountPoint = false;
        } else {
            options.removeMountPoint = false;
        }

        grunt.verbose.writeflags(options, 'Options');

        var exec = require('./lib/exec'),
            result = '',
            done = this.async();

        if (options.mount) {
            commandBuilder = require('./lib/command-builder').mount;
            command = commandBuilder(options, process.platform, path.sep);

            if(grunt.file.exists(options.mountPoint)){
                grunt.log.ok('mount point already exists');
                done();
            } else {

                if(process.platform !== 'win32'){
                    grunt.file.mkdir(options.mountPoint, {force: true});
                }

                exec(command, grunt, done);

            }

        } else {
            commandBuilder = require('./lib/command-builder').unmount;
            command = commandBuilder(options, process.platform, path.sep);

            exec(command, grunt, function(){
                grunt.verbose.writeln('deleting folder: ' + options.mountPoint);
                deleteMountPoint(options.mountPoint);
                done();
            });

        }

    });
};