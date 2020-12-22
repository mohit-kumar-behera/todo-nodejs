//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// //connect to mongoose locally
// mongoose.connect("mongodb://localhost:27017/toDoListDB",{useNewUrlParser:true,useUnifiedTopology:true});

//connect to mongoose on their cloud service
mongoose.connect("mongodb+srv://admin-mohit:hunting4something@cluster0.ucri0.mongodb.net/toDoListDB",{useNewUrlParser:true,useUnifiedTopology:true});

//items schema
const itemsSchema = new mongoose.Schema({
  name:String
});

//model for mongoose
const Item = mongoose.model("Item",itemsSchema);

//default item to model or document creation
const item1 = new Item({
  name:"Welcome to your todo list"
});
const item2 = new Item({
  name:"Hit the + button to add a new list"
});
const item3 = new Item({
  name:"You are ready to Go."
});

const listSchema = new mongoose.Schema({
  name:String,
  items:[itemsSchema] // Array of listSchema
});

const List = mongoose.model("List",listSchema);


app.get("/", function(req, res) {

  Item.find({},function(err,foundItems){
    if(err){console.log(err);}else{
      if(foundItems.length == 0){ //if items collection is empty then only add the default item
        Item.insertMany([item1,item2,item3],function(err){
          if(err){console.log(err);} else{console.log("Successfully inserted default items to the db");}
        });
        res.redirect("/");//go back to the home route after adding default items
      } else{
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Item({
    name:itemName
  });
  if(listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    //new item comes from a custom list
    List.findOne({name:listName},function(err,foundList){
      //foundList is an object
      //foundList.items is an array and we want to push the newly created items there
      foundList.items.push(newItem);
      foundList.save()
    });
    res.redirect("/"+listName);
  }

});

app.post("/delete",function(req,res){
  // console.log(req.body.checkbox);
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today") {
    Item.findByIdAndRemove({_id:checkedItemID},function(err){
      if(err){console.log(err)}else{console.log("Successfully deleted")};
      res.redirect("/");
    });
  } else { //delete request is coming from custom list
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemID}}},function(err,foundList){
      if(!err) {
        res.redirect("/"+listName);
      }
    })
  }
})

//dyanamic routing
app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name:customListName},function(err,foundList){
    if(!err){
      if(!foundList) {
        //console.log("List Doesn't exist")
        //Create a new one
        const list = new List({
          name:customListName,
          items:[item1,item2,item3]
        });
        list.save();
        res.redirect("/"+customListName);
      } else {
        //dont create a new one, list already exists
        //show the list
        res.render("list",{listTitle: foundList.name, newListItems:foundList.items})
      }
    }
  })
});

app.get("/about", function(req, res){
  res.render("about");
});

let PORT = process.env.PORT || 3000
app.listen(PORT, function() {
  console.log("Server started on port successfully");
});
