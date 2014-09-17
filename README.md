# BEAVER.JS

*  Beaver.js is a web framework built upon express.js. It is designed to be scalable, fast and well-written.
*  Beaver.js make writing API easily and enjoyable while maintains best performance offered by Node.
*  It is suitable for startup application while an application can be done within weeks.

## Tech stack:
### Server side:
```
* NodeJs > 0.11 (for harmony feature)
* Express.Js
* Sequelize for ORM.
* Moongoose for Mongo.
* Socket.Io for websocket
* MySQL + Mongo + Redis (as main data store)
* Nginx as reverse proxy
* Jasmine as testing framework
```

### Client Side:
```
* AngularJs
* Bootstrap
* Less(for css)
* Grunt (as asset compiler)
```

## Coding Pattern:
While callback is natively supported by node, it is buggy and should be replaced by promise as alternative.
Most of the code are written using promise + generator. Both play very well with each other while making code much cleaner
and easier to maintain.


## Author
Nguyen Xuan Tuong <nguy0066@ntu.edu.sg>
