var Q                   = require("q");
var _                   = require('lodash-node');
var winston             = require('winston');
var async               = require('async');
var express             = require("express");
var Route               = express.Route;
var Router              = express.Router;
var request             = require('supertest');
var methods             = require('methods');

//Route test suite
describe("route", function(){
    it('should dispatch request', function(done){
        var req = {
            method: 'get',
            path: '/'
        }

        //create a simple route with a single middleware
        var route = new Route("/foo");
        route.all(function(req, res, next){
            req.called = true;
            next();
        });

        //dispatch request using this route
        route.dispatch(req, {}, function(err){
            expect(req.called).toBe(true);
            done();
        });
    });

    it('should stack middleware', function(done){
        var req = {
            method: 'get',
            path: '/'
        }

        var route = new Route("/foo");
        var count = 0;

        route.all(function(req, res, next){
            count++;
            next();
        });

        route.all(function(req, res, next){
            count++;
            next();
        });

        //dispatch -- args: req, res, done
        route.dispatch(req, {}, function(err){
            expect(count).toBe(2);
            done();
        });
    });
});

//Router test suite
describe("router", function(){
    it('should use another router', function(done){
        var req = {
           method: 'get',
           url: '/foo/bar'
        }

        var router = new Router();
        var another = new Router();

        another.use('/foo', router);

        var count = 0;

        router.use('/bar', function(req, res, next){
            count++;
            next();
        });

        //args: req, res, done
        another.handle(req, {}, function(err){
            expect(count).toBe(1);
            done();
        });
    });

    it('should get params', function(done){
        var req = {
            method: 'GET',
            url: '/foo/2'
        }

        var router = new Router();
        var another = new Router();

        var id;
        another.use('/foo',  router);
        router.get('/:id', function(req, res, next){
            id = parseInt(req.params['id']);
            next();
        });

        another.handle(req, {}, function(err){
            expect(id).toEqual(2);
            done();
        });
    });

    it('should route', function(done){
        var router = new Router();
        var count = 0;

        router.route('/foo')
            .all(function(req, res, next){
                ++count;
                next();
            });

        router.handle({method: 'GET', url: '/foo'}, {}, function(err){
            expect(count).toBe(1);
            done();
        });
    });

    it('should call end in res obj', function(done){
        var router = new Router();

        router.route('/foo')
            .get(function(req, res, next){
                res.end();
            });

        //res object has end
        router.handle({method: 'GET', url: '/foo'}, {end: done});
    });
});

//Express test suite
describe('express', function(){
    it('should inherit event emitter', function(done){
        var app = express();

        app.on('load', function(data){
            expect(data.value).toBe(1);
            done();
        });

        app.emit('load', {value: 1});
    });

    it('should return a route', function(done){
        var app = express();

        //app.route is similar to router.route
        app.route('/foo')
            .all(function(req, res, next){
                next();
            })
            .get(function(req, res){
                res.send('get')
            })
            .post(function(req, res) {
                res.send('post');
            });

        request(app)
            .post('/foo')
            .expect('post', done);
    });

    it('should pass use', function(done){
        var app = express();

        app.use('/foo', function(req, res, next){
            res.send('foo');
            next();
        });

        request(app)
            .get('/foo/bar')
            .expect('foo', done);
    });

    it('should ignore use', function(done){
        var app = express();

        var count = 0;

        app.use('/foo', function(req, res, next){
            count++;
            next();
        });

        request(app)
            .get('/bar')
            .end(function(res){
                expect(count).toBe(0);
                done();
            });
    });

    it('should match regex group', function(done){
        var app = express();

        app.get(/^\/user\/([0-9]+)\/(view|edit)?$/, function(req, res, next){
            var userId = req.params[0],
                op = req.params[1];

            expect(userId).toEqual('2');
            expect(op).toEqual('view');
            next();
        });

        request(app)
            .get("/user/2/view")
            .end(function(){
                done();
            });
    });

    //should emit mount event
    it('should mount', function(done){
        var app = express();
        var another = express();

        app.on('mount', function(another){
            expect(another).toBe(another);
            //parent child relationship
            expect(app.parent).toBe(another);
            done();
        });

        another.use(app);
    })
});

describe('express drill', function(){
    it('should print routes', function(done){
        var app = express();
        var router = new Router();

        router.route('get', '/bar', function(req, res, next){
            next();
        });

        console.log(router.match);
        done();
    })
});