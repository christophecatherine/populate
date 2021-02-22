const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const Handlebars = require("handlebars");
const methodeOverride = require("method-override");

//Upload image
const multer = require("multer")
    //recupere le file img en discktorage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        //callBack avec null et le chemin du fichier
        cb(null, './public/uploads')
    },

    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
})

const upload = multer({ storage: storage })
    //var upload = multer({    dest: 'uploads/'})

//Dans les versions nouvelles est remplace par .lean 
const {
    allowInsecurePrototypeAccess
} = require('@handlebars/allow-prototype-access');


//Express 
const port = 1972;
const app = express();

//Express static
app.use(express.static("public"));


//Method-override
app.use(methodeOverride("_method"));

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
    useNewUrlParser: true,
    useUnifiedTopology: true
})

//model de notre schema
const productSchema = {
    title: String,
    content: String,
    price: Number,
    cover: {
        name: String,
        originalName: String,
        path: String,
        createAT: Date

    }
};



// permet de recuperer notre model avec mongoose
const Product = mongoose.model("product", productSchema)



// Routes
app.route("/")
    //methode GET
    .get(
        (req, res) => {
            Product
                .find(function(err, produit) {
                    if (!err) {
                        res.render('index', {
                            product: produit
                        })
                    } else {
                        res.send(err)
                    }
                })
                //Nouvelle version de const {
                //  allowInsecurePrototypeAccess
                //} = require('@handlebars/allow-prototype-access')

            // Product
            //     .findOne({ title: "gdfsf" })
            //     .lean()
            //     .exec((err, produit) => {
            //         if (!err) {
            //             res.render('index', {
            //                 product: produit
            //             })
            //         } else {
            //             res.send(err)
            //         }
            //     })
        })

//methode POST
//middleware upload.single
.post(upload.single("cover"),
    (req, res) => {

        // recupere notre fichier 
        const file = req.file;
        console.log(file);

        //creer une instatnce de product 
        const newProduct = new Product({
            title: req.body.title,
            content: req.body.content,
            price: req.body.price
        });

        //recupere le new file pour l'integrer dans la propriete schema cover
        if (file) {
            newProduct.cover = {
                name: file.filename,
                originalName: file.originalname,
                //path: "uploads/" + filename
                //permet de recupere le file public 
                path: file.path.replace("public", ""),
                createAT: Date.now()
            }
        }

        //sauvegarde dans la base de donnee
        newProduct.save(function(err) {
            if (!err) {
                res.send("save ok !")
            } else {
                res.send(err)
            }
        })
    })


//methode DELETE
.delete(function(req, res) {
    Product.deleteMany(function(err) {
        if (!err) {
            res.send("All delete")
        } else {
            res.send(err)
        }
    })
})



// Route edition
//recupere l'id de notre article 
app.route("/:id")
    //method GET
    .get(function(req, res) {
        // Adventure.findOne({ country: 'Croatia' }, function (err, adventure) {});
        //recupere Product
        Product.findOne(
            //recupere valeur de l'id
            {
                _id: req.params.id
            },
            function(err, produit) {
                if (!err) {
                    // res. render dans la page edition
                    res.render("edition", {
                        //objet
                        _id: produit.id,
                        title: produit.title,
                        content: produit.content,
                        price: produit.price
                    })
                } else {
                    res.send("err")
                }
            }
        )
    })

//method PUT pour mettre a jour les infos 
.put(function(req, res) {
    Product.updateOne(
        //condition qui recupere l'id
        {
            _id: req.params.id
        },

        //updateOne qui recupere les valeurs
        {
            title: req.body.title,
            content: req.body.content,
            price: req.body.price,
        },


        //option faire plusieurs modification en meme temps
        {
            multi: true
        },
        //exec
        function(err) {
            if (!err) {
                res.send("updateOne OK !")
            } else {
                res.send(err)
            }
        }
    )
})

//method DELETE pour filtrer 
.delete(function(req, res) {
    Product.deleteOne({
            _id: req.params.id
        },
        //on supprime l'element en fonction de son id
        function(err) {
            if (!err) {
                res.send("product delete")
            } else {
                res.send(err)
            }
        }
    )
})

app.listen(port, function() {
    console.log(`écoute le port ${port}, lancé à : ${new Date().toLocaleString()}`);

})