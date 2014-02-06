module.exports = (grunt) ->

    grunt.initConfig
        pkg: grunt.file.readJSON 'package.json'

        # merge js files
        concat:
            options:
                separator: ';'
            dist:
                src: ['build/**/*.js']
                dest: 'dist/<%= pkg.name %>.js'

        # minify js files
        uglify:
            options:
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            build:
                src: ['<%= concat.dist.dest %>']
                dest: 'final/<%= pkg.name %>.min.js'
                # files: 
                #     'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']

        # compile coffeescript
        coffee:
            compile:
                expand: true
                flatten: true
                cwd: 'src/'
                src: ['**/*.coffee']
                dest: 'build'
                ext: '.js'

        # watch for coffee changes
        watch:
            client:
                options: { nospawn: true }
                files: "src/**/*.coffee"
                tasks: ["coffee"]


    grunt.loadNpmTasks 'grunt-contrib-uglify'
    grunt.loadNpmTasks 'grunt-contrib-concat'
    grunt.loadNpmTasks 'grunt-contrib-coffee'
    grunt.loadNpmTasks 'grunt-contrib-watch'

    grunt.registerTask 'compact', ['concat', 'uglify']
    grunt.registerTask 'build', ['coffee']
    grunt.registerTask 'default', ['build']