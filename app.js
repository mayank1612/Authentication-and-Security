const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose = require('mongoose');
const encrypt=require("mongoose-encryption");

const app=express();

app.set("view engine","ejs");

app.use(express.static("public"));

app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema=new mongoose.Schema({
    email:String,
    password:String
});

const secret="Thisismylittlesecret.";

userSchema.plugin(encrypt, { secret:secret, encryptedFields: ['password'] });

const User=mongoose.model("User",userSchema);


app.get("/",function(req,res){
    res.render("home")
})

app.get("/register",function(req,res){
    res.render("register")
})

app.get("/login",function(req,res){
    res.render("login")
})

app.post("/register",function (req,res) {
    const username=req.body.username;
    const password=req.body.password;
    const newUser=new User({
        email:username,
        password:password
    });
    newUser.save(function (err) {
        if(!err){
            res.render("secrets");
        }else{
            console.log(err);
        }
    })
})

app.post("/login",function (req,res) {
    const username=req.body.username;
    const password=req.body.password;
    User.findOne({email:username},function (err,foundUser) {
        if(!err){
            if(foundUser.password===password){
                res.render("secrets");
            }
        } else{
            console.log(err);
        }
    })
})

app.listen(3000,function(){
    console.log("server is running on port 3000");
})