const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const Handlebars = require("handlebars");
const {
    allowInsecurePrototypeAccess
} = require('@handlebars/allow-prototype-access')

const app = express();

// Handlebars
app.engine('hbs', exphbs({
    defaultLayout: 'main',
    extname: 'hbs',
    handlebars: allowInsecurePrototypeAccess(Handlebars)
}));
app.set('view engine', 'hbs')

// BodyParser
app.use(bodyParser.urlencoded({
    extended: true
}));


// MongoDB
mongoose.connect("mongodb://localhost:27017/boutiqueGame", {
    useNewUrlParser: true
})

//model de notre schema
const productSchema = {
    title: String,
    content: String,
    price: Number

};
// permet de recuperer notre model avec mongoose
const Product = mongoose.model("product", productSchema)




// Routes
app.route("/")
    //methode GET
    .get(
        (req, res) => {
            Product.find(function (err, produit) {
                if (!err) {
                    res.render('index', {
                        product: produit
                    })
                } else {
                    res.send(err)
                }
            })
        })

    //methode POST

    .post(
        (req, res) => {
            //creer une instatnce de product 
            const newProduct = new Product({
                title: req.body.title,
                content: req.body.content,
                price: req.body.price
            });
            //sauvegarde dans la base de donnee
            newProduct.save(function (err) {
                if (!err) {
                    res.send("save ok !")
                } else {
                    res.send(err)
                }
            })
        })



app.listen(4000, function () {
    console.log("écoute le port 4000");

})