#NAKE -- A JavaScript build system for Node.js

##Installing:

###Prerequisites:
* [Node.js](http://nodejs.org/)

###Installing with [NPM](http://npmjs.org/):

    npm install -g nake

###Sources:

    git clone git://github.com/cpradog/nake.git

##Usage:

    nake [options] [task] [arg1] [arg2] ...

##Description:

Nake is a build system writen entirely in javascript and focused in provide a
complete build system for node.js projects.

###Features:

* Nakefiles are standard JavaScript syntax or [CoffeScript](http://coffeescript.org/).
* Task with prerequisites
* Namespaces
* Asynchronous task execution
* A built-in library with common tasks (Work in progress)
* Include tasks from other modules

##Examples:

###A Nakefile that execute the application tests with mocha:

    desc('Executes the application tests. Use test FILE to execute a subset of tests.');
    task('test', function(file) {
        exec('./node_modules/.bin/mocha -c ' + file, this.done);
    }, { async: true });

To execute all application tests:

    nake test

To execute only core tests:

    nake test test/core/*.js


##Syntax reference:

A Nakefile is just JavaScript. Nake includes some functions that allow to define tasks, namespaces, ...

###Task

A task is the main unit of work in a Nakefile.

    task(name, [dependencies], actions, options);

* Name: A string with the name for the task.
* Dependencies: (optional) An array of strings with the task names of dependencies to perform first.
* Actions: A function to execute when the task is invoked. Any task arguments will be passed as fuction arguments in the same order.
* options: Allow to configure aditional task behaviour.
    + async: If true the task will be executed in asynchronous mode and will require to call this.done() to finish the task.

####Task description

To add a description to a task use the desc function before the task definition.

    desc(description_text)
    task(...)

* Description_text: A string with the task description.

###Namespace

A namespace allow to group tasks and avoids name collisions.

    namespace(name, function() {
        desc(...)
        task(...)
        namespace(...)

        ...
    });

* Name: A string with the namespace name.

###Call

A call allows to execute other tasks inside a task.

    call(task_name, arguments, callback);

* Task_name: A string with the reference to the task to call.
* Arguments: (Optional) An array with the task arguments.
* Callback: A function to call when the other task execution is completed.

###Include

You can include other Nakefiles.

    include(file);

* File: A string with the path of the file to include relative to the current Nakefile.

###Property

You can use a property bag to share parameters between tasks.
Properties are shared between Nakefiles.

To set a property:

    property(name, value);

To get a property value:

    var value = property(name);

* Name: A string with the property name.
* Value: Any value for the property.

## Related projects

Matthew Eernisse's Jake: <http://raw.github.com/mde/jake>

A JavaScript port of Rake for Node.js.

James Coglan's "Jake": <http://github.com/jcoglan/jake>

Confusingly, this is a Ruby tool for building JavaScript packages from source code.

280 North's Jake: <http://github.com/280north/jake>

This is also a JavaScript port of Rake, which runs on the Narwhal platform.

## Author

Carlos Prado, cpradog@me.com

## Contributors

Any help is welcome.

## License

Licensed under the Apache License, Version 2.0
(<http://www.apache.org/licenses/LICENSE-2.0>)
