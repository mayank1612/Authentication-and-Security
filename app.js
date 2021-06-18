require('dotenv').config();
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport=require('passport');
const passportLocalMongoose=require('passport-local-mongoose');
mongoose.set('useCreateIndex', true);
const GoogleStrategy = require('passport-google-oauth20').Strategy;
var findOrCreate = require('mongoose-findorcreate');

const app=express();

app.set("view engine","ejs");

app.use(express.static("public"));

app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret: 'Our little secret.',
    resave: false,
    saveUninitialized: true,
  }));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect(process.env.MONGOOSE_STRING, 
{useNewUrlParser: true, useUnifiedTopology: true});

const userSchema=new mongoose.Schema({
    username:String,
    password:String,
    googleId:String,
    secrets: [{type: String}]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User=mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://arcane-earth-62220.herokuapp.com/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
      
    User.findOrCreate({ googleId: profile.id,username: profile.emails[0].value }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
    res.render("home")
})

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile","email"] }));
  
  app.get("/auth/google/secrets", 
    passport.authenticate('google', { failureRedirect: "/login" }),
    function(req, res) {
      // Successful authentication, redirect secrects.
      res.redirect("/secrets");
    });

app.get("/register",function(req,res){
    res.render("register")
})


app.get("/login",function(req,res){
    res.render("login")
})

app.get("/logout",function (req,res) {
    req.logout();
    res.redirect("/");
})

app.get("/submit",function (req,res) {
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
})

app.get("/secrets",function (req,res) {
    User.find({"secrets":{$ne:null}},function(err, foundUsers){
        if(!err){
            if(foundUsers){
                res.render("secrets",{usersWithSecrets:foundUsers});
            }
        }else{
            console.log(err);
        }
    })
})

app.post("/submit",function (req,res) {
    const submittedSecret=req.body.secret;
    User.findById(req.user.id,function (err,foundUser) {
        if(!err){
            foundUser.secrets.push(submittedSecret);
            foundUser.save(function (err) {
                if(!err){
                    res.redirect("/secrets");
                }
            });
        }else{
            console.log(err);
        }
    });

})

app.post("/register", function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
      if (err) {
        console.log(err);
        res.redirect("/register");
        
      } else {
        passport.authenticate("local")(req, res, function(){
          res.redirect("/secrets");
        });
      }
    });
  
  });

app.post("/login",function (req,res) {

    const user=new User({
        email:req.body.email,
        password:req.body.password
    });

    req.login(user,function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
    
});

let port=process.env.PORT;
if(port==null || port==""){
  port=3000;
}


app.listen(port, function () {
  console.log("Server started on port 3000");
});
