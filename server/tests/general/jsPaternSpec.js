var Q                   = require("q");
var _                   = require('lodash-node');
var winston             = require('winston');
var async               = require('async');

describe('common pattern', function(){
    //avoid global scope as well as all instance will share the same entity (global) for those function
    it('should use module pattern', function(){
        var func = (function(){
            var entity = {
                quot: '"',
                lt: '<',
                gt: '>'
            };

            return function(s){
                return s.replace(/&([^&;]+);/g,
                    function (a, b) {
                        var r = entity[b];
                        return typeof r === 'string' ? r : a;
                    }
                );
            };
        })();

        expect(func('&lt;&quot;&gt;')).toEqual('<">');
    });

    //closure enable create so-call global variable
    it('should create global variable in closure', function(){
        var func = (function(){
            var count = 0;
            return function(){
                this.get = function(){
                    return count;
                }
                this.set = function(newCount){
                    count = newCount;
                }
            }
        })();

        var counter = new func();
        var another = new func();
        counter.set(3);
        expect(another.get()).toBe(3);
    });

    //function invocation -- call, apply and bind
    it('should invoke function', function(){
        var obj = {
            name: 'A',
            hello: function(s){
                return this.name + s;
            }
        };

        //this -- still bind to a object
        expect(obj.hello('A')).toEqual('AA');

        //if copy function; then it doesn't work
        var another = obj.hello;
        //this now is binded to global object
        expect(another('A')).not.toEqual('AA');

        //using call is ok
        expect(another.call(obj, 'A')).toEqual('AA');
        //or apply
        expect(another.apply(obj, ['A'])).toEqual('AA');

        //or when clone function need to bind with this context
        var helloFunc = obj.hello.bind(obj);
        expect(helloFunc('A')).toEqual('AA');
    });

    //using function prototype -- allow inheritance via proto
    //eliminate need of redefine property for each function
    it('should inherit the same proto', function(){
        var Person = function(name, age){
            this.name = name;
            this.age = age;
        };

        Person.prototype.getName = function(){
            return this.name;
        };

        var personA = new Person('A', 20);
        var personB = new Person('B', 10);

        //both can access the proto
        expect(personA.getName()).toEqual('A');
        expect(personB.getName()).toEqual('B');

        //this way -- every instance will need to initialize get name
        //and therefore it should be avoid
        Person = function(name, age){
            this.name = name;
            this.age = age;

            this.getName = function()
            {
                return this.name;
            }
        }

        personA = new Person('A', 20);
        expect(personA.getName()).toEqual('A');
    });

    it('should bind using lodash', function(){
        var Person = function(name, age){
            this.name = name;
            this.age = age;

            //can bind this function to every instance to avoid invalid this
            this.getName = _.bind(this.getName, this);
        }

        Person.prototype.getName = function(){
            return this.name;
        }

        Person.prototype.getAge = function(){
            return this.age;
        }

        var personA = new Person("A", 20);
        var getNameFunc = personA.getName;
        var getAgeFunc = personA.getAge;

        expect(getNameFunc()).toEqual("A");
        expect(getAgeFunc()).not.toEqual(20);
    });

    it('should inherit object through prototype chain', function(){
        var Person = function(name, age){
           this.name = name;
           this.age = age;
        }

        Person.prototype.getName = function(){
            return this.name;
        }

        var Hero = function(name, age, power){
            //1. need to call the parent constructor on this object
            Person.call(this, name, age);
            this.power = power;
        }

        //2. need to point prototype to an INSTANCE of Peron
        // then it wipe off the constructor (using parent constructor for ex)
        Hero.prototype = new Person();

        //3. then need to explicitly assign to constructor -- why uncomment it still work
        Hero.prototype.constructor = Hero;

        //4. then you can declare other attribute function
        Hero.prototype.getPower = function(){
            return this.power;
        }

        var heroA = new Hero("A", 20, "super");
        expect(heroA.getName()).toEqual("A");
        expect(heroA.getPower()).toEqual("super");
    });
});