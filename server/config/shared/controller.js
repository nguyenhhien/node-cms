module.exports.controllers = {
    uri:
    {
        /**
         * `EmailController.index`
         * :::::::::::::::::::::::::::::::::::::::::::::::::::::::
         * `GET     /email/:id?`        `GET    /email/index/:id?`
         * `POST    /email/:id?`        `POST   /email/index/:id?`
         * `PUT     /email/:id?`        `PUT    /email/index/:id?`
         * `DELETE  /email/:id?`        `DELETE /email/index/:id?`
         *
         * `EmailController.send`
         * :::::::::::::::::::::::::::::::::::::::::::::::::::::::
         * `GET     /email/send/:id?`
         * `POST    /email/send/:id?`
         * `PUT     /email/send/:id?`
         * `DELETE  /email/send/:id?`
         */
        actions: true,
        /**
         * GET      /boat/:id?      -> BoatController.find
         * POST     /boat           -> BoatController.create
         * PUT      /boat/:id       -> BoatController.update
         * DELETE   /boat/:id       -> BoatController.destroy
         */
        rest: true,
        shortcuts: true,
        /**
         * `GET /api/foo/:id?`
         */
        prefix: '/api',
        pluralize: false
    },
    jsonp: false,
    expectIntegerId: false
}