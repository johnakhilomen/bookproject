const express = require("express");
const bodyparser = require("body-parser");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const config = require("./config/config").get(process.env.NODE_ENV);
const app = express();

const {User} = require("./model/user");
const {Book} = require("./model/book");

mongoose.Promise =  global.Promise;
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(config.DATABASE)
.then(() => console.log("mongoDB connected"))
  .catch(err => console.log(err));

app.use(bodyparser.json());
app.use(cookieParser());

//GET
app.get("/", (req, res) => res.send("hello!!"));

//GET BOOK BY ID
app.get("/api/getBook", (req, res) => 
{
    let id = req.query.id;
    Book.findById(id, (err, doc) => 
    {
        if(err)
        {
            return res.status(400).send(err);
        }
        res.send(doc);
    })
});

//GET ALL BOOKS LIKE PAGINATION
app.get("/api/books", (req, res) => 
{
    //localhost:3001/api/books?skip=1&limit=2&order=asc
    let skip = parseInt(req.query.skip);
    let limit = parseInt(req.query.limit);
    let order = req.query.order;
    Book.find().skip(skip).sort({_id:order}).limit(limit).exec((err, doc) =>
    {
        if(err)
        {
            return res.status(400).send(err);
        }
        res.send(doc);
    })
});

//FETCH ALL USERS
app.get("/api/users", (req, res) =>
{
    User.find((err, users) => {

        if(err)
        {
            res.json({"response" : "No users"});
        }
        res.send(users);
    });
})

//FETCH BOOK BY OWNER ID
app.get("/api/getbookbyownerid", (req, res) =>
{
    Book.find({ownerid: req.body.userid}).exec((err, doc) => 
    {
        if(err)
        {
            res.status(400).json({
                "response" : err
            });
        }
        res.send(doc);
    });
})

//GET FIRSTNAME AND LASTNAME
app.get("/api/getFirstnameAndLastname", (req, res) =>
{

    User.findById(req.query.id, (err, doc) =>
    {
        if(err)
        {
            res.status(400).json({
                "response":err
            })
        }
        res.json({
            firstname: doc.name,
            lastname: doc.lastname
        });
    });
});

//POST
app.post("/api/book", (req, res)=>
{
const book = new Book(req.body);
book.save((err, doc)=>{
    if(err) 
    {
        return res.status(400).send(err);
    }
    res.status(200).json({
        post:true,
        bookId: doc._id
    })
})

});

app.post("/api/registerUser", (req, res) =>
{

    const user = new User(req.body);

    user.save((err, doc) => {
        if(err)
        {
            res.status(400).send({"result" : false});
        }
        res.status(200).json({
            success:true,
            user:doc
        })
    })
});

//UPATE
app.post("/api/updateBook", (req, res) => 
{
Book.findByIdAndUpdate(req.body._id, req.body, {new:true}, (err, doc) =>
{
    if(err)
    {
        return res.status(400).send(err);
    }
    res.json({
        success:true,
        doc
    })
})
});

//DELETE
app.delete("/api/deleteBook", (req, res) =>
{
    let id = req.body.id;
    Book.findByIdAndDelete(id, (err, doc) =>
    {
        if(err)
        {
            return res.status(400).send(err);
        }
        res.json({"responseback" : true});
    })
})

const port = process.env.PORT || 3001;
app.listen(port,()=>{
    console.log(`SERVER RUNNNING`)
})

//LOG IN
app.post("/api/userlogin", (req, res) =>
{
    User.findOne({"email": req.body.email}, (err, user) =>
    {
        if(!user)
        {
            return res.json({isAuth: false, message: "Auth failed, email"})
        }
        user.comparePassword(req.body.password, (err, isMatch) =>
        {
            if(!isMatch)
            {
                return res.json ({
                    isAuth:false,
                    message:"Wrong Password"
                });
            }
            user.generateToken((err, user)=> {

                if(err)
                {
                    return res.status(400).send(err);
                }
                res.cookie("auth", user.token).json({
                    isAuth:true,
                    id:user._id,
                    email:user.email
                })
            });

        });

    })
})


