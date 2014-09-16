var express             = require("express");
var supertest           = require('supertest');
var methods             = require('methods');
var http                = require('http');
var connect             = require('connect');
var superagent          = require('superagent')
var _                   = require('lodash-node');
var Q                   = require("q");
var winston             = require('winston');
var async               = require('async');

var Route               = express.Route;
var Router              = express.Router;

describe('express route, router', function(){
    it('should unbind router', function(done){
        var app = express();

        app.get('/foo', function(req, res, next){
            res.json({number: 1});
        });

        app.get('/bar', function(req, res, next){
            res.json({number: 2});
        });

        app._router.stack = app._router.stack.filter(function(elem){
            if(elem.route && elem.route.path == '/foo')
            {
                return false;
            }
            else return true;
        });

        var s = app.listen(4101, function(){
            async.series([
                function(next)
                {
                    supertest(app)
                        .get('/foo')
                        .end(function(err, res){
                            expect(res.status).toEqual(404);
                            next();
                        });
                },
                function(next)
                {
                    supertest(app)
                        .get('/bar')
                        .end(function(err, res){
                            expect(res.body.number).toEqual(2);
                            next();
                        });
                }
            ], function(err, data){
                expect(!!err).toEqual(false);
                s.close();
                done();
            });
        });
    });

    it('should use', function(done){
        var app = express();
        var called = [];

        //app.use -> forward to connect use
        app.use(function(req, res, next){
            called = ['before'];
            next();
        });

        //app.get -> setup router.get -> then call app.use (router)
        app.get('/foo', function(req, res, next){
            called.push('foo');
            next();
        });

        var s = app.listen(4101, function(){
            supertest(app)
                .get('/foo')
                .end(function(err, res){
                    expect(called.length).toBe(2);
                    expect(called[0]).toEqual('before');
                    expect(called[1]).toEqual('foo');
                    s.close();
                    done();
                });
        });
    });
});