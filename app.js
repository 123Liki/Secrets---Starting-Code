//jshint esversion:6
require("dotenv").config()
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const session=require("express-session");
const psp=require("passport");
const pspLMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require("mongoose-findorcreate");
const app=express();

//const md5=require("md5");
//const mencrypt=require("mongoose-encryption")

//console.log(process.env.API_KEY);

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended:true
}))
app.use(session({
    secret:"Our little secret.",
    resave:false,
    saveUninitialized:false
}))

app.use(psp.initialize());
app.use(psp.session());

mongoose.connect("mongodb://127.0.0.1/userDB",{useNewUrlParser:true});
const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
})

userSchema.plugin(pspLMongoose);
userSchema.plugin(findOrCreate);

//userSchema.plugin(mencrypt,{secret:process.env.SECRET,encryptedFields:["password"]})

const User = new mongoose.model("User",userSchema);

psp.use(User.createStrategy());

psp.serializeUser(function(user,done){
    done(null,user.id);
});
psp.deserializeUser(function(id,done){
    User.findById(id).then(user=>{
        done(null,user);
    })
    .catch(err=>{
        done(err,null);
    })
});
psp.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
    res.render("home")
})

app.get("/auth/google",
    psp.authenticate("google",{scope: ["profile"]})
);
app.get("/auth/google/secrets", psp.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.get("/login",function(req,res){
    res.render("login")
})

app.get("/register",function(req,res){
    res.render("register")
})

app.get("/logout",function(req,res){
    req.logout(function(err){
        if(err){
            console.log(err);
        }
        res.redirect("/");
    });
})
app.get("/secrets",function(req,res){
    User.find({"secret":{$ne:null}}).then(founds=>{
        if(founds){
        res.render("secrets",{userSecrets:founds})
        }
    })
})
app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    } else{
        res.redirect("/login");
    }
})
app.post("/submit",function(req,res){
    const submittedSecret=req.body.secret;
    User.findById(req.user.id).then(found=>{
        if(found){
            found.secret=submittedSecret;
            found.save().then(()=>{
                res.redirect("/secrets");
            })
        }
        })
        .catch(err=>{
            console.log(err);
        })
})
app.post("/register",function(req,res){
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            psp.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
    
})

app.post("/login",function(req,res){
    const user=new User({
        username:req.body.username,
        password:req.body.password
    })
    req.login(user,function(err){
        if(err){
            console.log(err);
        }else{
            psp.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })

})
app.listen(3000,function(){
    console.log("Server started on port 3000")
})