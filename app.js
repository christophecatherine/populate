//on recupere nos moduls
const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const Handlebars = require("handlebars");
const methodeOverride = require("method-override");
const path = require('path');
const sharp = require('sharp')

//Upload image
const multer = require("multer")
    //recupere le file img en discktorage
const storage = multer.diskStorage({

    destination: function(req, file, cb) {
        //callBack avec null et le chemin du fichier
        cb(null, './public/uploads')
    },

    filename: function(req, file, cb) {

        const ext = path.extname(file.originalname);
        const date = Date.now();

        //callback donne un nom au file
        cb(null, date + '-' + file.originalname)

        // cb(null, file.fieldname + '-' + date + ext)
    }
})

const upload = multer({
    storage: storage,

    //permet de filtrer la taile
    limits: {
        fileSize: 8 * 2048 * 2048,
        files: 1,
    },

    //permet de filtrer au format 
    fileFilter: function(req, file, cb) {
        //console.log(file)
        if (
            file.mimetype === "image/png" ||
            file.mimetype === "image/jpeg" ||
            file.mimetype === "image/jpg" ||
            file.mimetype === "image/gif"
        ) {
            cb(null, true)
        } else
            cb(new Error('le fichier doit etre au format png, jpg ou gif'))
    }
})

//var upload = multer({ dest: 'uploads/'})

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
const productSchema = new mongoose.Schema({
    title: String,
    content: String,
    price: Number,
    category: { type: mongoose.Schema.Types.ObjectId, ref: "category" },
    cover: {
        name: String,
        originalName: String,
        path: String,
        urlSharp: String,
        createAT: Date

    }
});

const categorySchema = new mongoose.Schema({
    title: String
})


// permet de recuperer notre model avec mongoose
const Product = mongoose.model("product", productSchema)
const Category = mongoose.model("category", categorySchema)



// Routes
app.route("/category")
    .get((req, res) => {

        Category.find((err, category) => {
            if (!err) {
                res.render("category", {
                    // valeur de category de notre valeur find
                    categorie: category
                })
            } else {
                res.send(err)
            }
        })
    })
    .post((req, res) => {
        const newCategory = new Category({
            title: req.body.title
        })
        newCategory.save(function(err) {
            if (!err) {
                res.send("category save")
            } else {
                res.send(err)
            }
        })
    })



app.route("/")
    //methode GET
    .get(
        (req, res) => {
            //model qui execute
            Product
                .find()
                //populate pour fusionner les 2 collections
                .populate("category")
                .exec(function(err, produit) {
                    if (!err) {
                        //appel la method category
                        Category.find(function(err, category) {

                            res.render('index', {
                                product: produit,
                                categorie: category
                            })
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

        //redimention de l'img
        sharp(file.path)
            .resize(200)
            .webp({
                quality: 80
            })
            // .rotate(90)
            //on demande qu'il affiche dans le dossier webp et on enleve le nom du format pour recuperer au format webp
            .toFile('./public/uploads/web/' + file.originalname.split('.').slice(0, -1).join('.') + ".webp", (err, info) => {});

        //creer une instatnce de product 
        const newProduct = new Product({
            title: req.body.title,
            content: req.body.content,
            price: req.body.price,
            category: req.body.category
        });

        //recupere le new file pour l'integrer dans la propriete schema cover
        if (file) {
            newProduct.cover = {
                name: file.filename,
                originalName: file.originalname,
                //path: "uploads/" + filename
                //permet de recupere le file public 
                path: file.path.replace("public", ""),
                urlSharp: '/uploads/web/' + file.originalname.split('.').slice(0, -1).join('.') + ".webp",
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

//method DELETEONE pour filtrer 
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