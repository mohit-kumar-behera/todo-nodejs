const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// connect to mongoose
mongoose.connect('mongodb://localhost:27017/todo', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Items Schema
const itemsSchema = new mongoose.Schema({
  name: String,
});

// List Schema
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const Item = mongoose.model('Item', itemsSchema);
const List = mongoose.model('List', listSchema);

// Default entry to items
const item1 = new Item({
  name: 'Buy Milk',
});
const item2 = new Item({
  name: 'Go to Gym',
});
const item3 = new Item({
  name: 'Meditate for 15 minutes',
});

app.get('/', function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (err) {
      console.log(err);
    } else {
      if (foundItems.length == 0) {
        //if items collection is empty then only add the default item
        Item.insertMany([item1, item2, item3], function (err) {
          if (err) console.log(err);
          else console.log('Successfully inserted default items to the db');
        });
        res.redirect('/'); //go back to the home route after adding default items
      } else {
        res.render('list', { listTitle: 'Today', newListItems: foundItems });
      }
    }
  });
});

app.post('/', function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName,
  });

  if (listName === 'Today') {
    // Entries added to default list
    newItem.save();
    res.redirect('/');
  } else {
    // Entries added to custom list
    List.findOne({ name: listName }, function (_, foundList) {
      foundList.items.push(newItem);
      foundList.save();
    });
    res.redirect('/' + listName);
  }
});

app.post('/delete', function (req, res) {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Item.findByIdAndRemove({ _id: checkedItemID }, function (err) {
      if (err) console.log(err);
      else console.log('Successfully deleted');
      res.redirect('/');
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemID } } },
      function (err) {
        if (!err) {
          res.redirect('/' + listName);
        }
      }
    );
  }
});

app.get('/:customListName', function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create a new List
        const list = new List({
          name: customListName,
          items: [],
        });
        list.save();
        res.redirect('/' + customListName);
      } else {
        // List already exists
        res.render('list', {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.listen(PORT, function () {
  console.log(`Server started on port ${PORT} successfully`);
});
