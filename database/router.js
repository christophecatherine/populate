/*
 * Import Module
 ****************/
const express = require('express'),
    router = express.Router(),

    /*
     * Controller
     *************/
    const indexController = require('./controllers/indexController'),

        indexController = require('./controllers/indexController'),

        // Home
        router.route('/')
        .get(homeController.get)

// Article
router.route('/article')
    .get(indexController.get)
    .delete(indexController.deleteAll)