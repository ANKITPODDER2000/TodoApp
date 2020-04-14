const express               = require('express'),
      app                   = express(),
      bodyParser            = require("body-parser"),
      flash                 = require('flash'),
      mongoose              = require('mongoose'),
      passport              = require("passport"),
      LocalStrategy         = require("passport-local"),
      passportLocalMongoose = require('passport-local-mongoose'),
      PORT                  = process.env.PORT || 8080;

//==========================================================================================//
let todoSchema = new mongoose.Schema({
    content: String,
    isDone: Boolean,
    date: String
});
Todo = new mongoose.model("Todo", todoSchema);

let UserSchema = new mongoose.Schema({
    usernmae: String,
    password: String,
    todo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref : "Todo"
    }]
});

UserSchema.plugin(passportLocalMongoose);
User = new mongoose.model("User", UserSchema);
//==========================================================================================//

/*
link->mongodb+srv://ap:<password>@cluster0-v5cee.mongodb.net/test?retryWrites=true&w=majority
mongoose.connect("mongodb://localhost/TodoAppList", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});*/

mongoose.connect("mongodb+srv://ankit:1234@cluster0-v5cee.mongodb.net/test?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

app.use(require('express-session')({
    secret: "Rusty is a Good Dog.",
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




app.set("view engine", "ejs");
app.use(express.static(__dirname+"/public"));
app.use(bodyParser.urlencoded({
    extended: true,
}))

app.use(function(req,res,next){
  res.locals.currentUser = req.user;
  next();
})

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/login", (req, res) => {
    res.render("login");
})

app.get("/signin",(req,res)=>{
    res.render("signin");
})

app.post("/login",passport.authenticate("local",
  {
    failureRedirect : "/",
  }),(req,res)=>{
  res.redirect("/todo/"+req.user["id"]);
})
app.post("/signin", (req, res) => {
    var userName = new User({ username: req.body.username });
    User.register(userName, req.body.password, function (error, user) {
        if (error) {
            res.redirect("/");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/todo/" + user['id']);
            });
        }
    })
})



app.get("/todo/:id", midl, function(req, res){
    res.render("todo");
});

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
})

app.get("/todo/:id/alltodo",midl, (req, res) => {
    User.findById(req.params.id).populate("todo").exec((err, user) => {
        if (err) {
            return res.render("/");
        } else {
            return res.json(user['todo']);
        }
    })
})

app.post("/todo/:id/posttodo", midl, (req, res) => {
    User.findById(req.params.id, (error, user) => {
        if (error)
        {
            return res.send(false);
        }
        Todo.create({
            content: req.body.data,
            isDone: false,
            date: new Date().toLocaleDateString().slice(0, (new Date().toLocaleDateString()).length - 4).concat(new Date().getYear() - 100),
        }, (err, todo) => {
            if (err) {
                return res.send(false);
            } else {
                user.todo.push(todo);
                user.save();
                return res.send(true);
            }
        })
    });
})

app.get("/todo/:userid/:todoid/done", (req, res) => {
    Todo.findById(req.params.todoid, (err,todo) => {
        if (err) {
            res.json(false)
        } else {
            todo['isDone'] = true,
            todo.save();
            res.json(todo);
        }
    })
})

app.get("/todo/:userid/:todoid/deleteTodo", (req, res) => {
    Todo.findByIdAndRemove(req.params.todoid, (err) => {
        if (err) {
            res.json(false)
        } else {
            res.json(true);
        }
    })
})

function midl(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/signin");
}

app.listen(PORT, () => {
    console.log("Server started on PORT : ", PORT);
})
