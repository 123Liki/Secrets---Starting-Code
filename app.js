//jshint esversion:6
require("dotenv").config()
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const app=express();
const mongoose=require("mongoose");
const bcrypt=require("bcrypt");
const saltRounds=0;

//const md5=require("md5");
//const mencrypt=require("mongoose-encryption")

//console.log(process.env.API_KEY);

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended:true
}))

mongoose.connect("mongodb://127.0.0.1/userDB",{useNewUrlParser:true});
const userSchema=new mongoose.Schema({
    email:String,
    password:String
})

//userSchema.plugin(mencrypt,{secret:process.env.SECRET,encryptedFields:["password"]})

const User = new mongoose.model("User",userSchema);

app.get("/",function(req,res){
    res.render("home")
})

app.get("/login",function(req,res){
    res.render("login")
})

app.get("/register",function(req,res){
    res.render("register")
})

app.post("/register",function(req,res){
    bcrypt.hash(req.body.password,saltRounds,function(hash){
        const user1= new User({
            email:req.body.username,
            password:hash
        })
        user1.save().then(()=>{
                res.render("secrets");
                
    
        })

    })
    
})

app.post("/login",function(req,res){
    const name=req.body.username;
    const password=req.body.password;
    User.findOne({email:name}).then(function(found){
        if(found)
        {
        //     bcrypt.compare(password,found.password).then(function(result){
        //         if(result===true){
                    res.render("secrets");
        //         }
        //     })
                
        // //         //console.log(password)
       }
    })
})
app.listen(3000,function(){
    console.log("Server started on port 3000")
})