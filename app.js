const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

let port = process.env.PORT;
if (port === null || port == "") {
  port = 3000;
}

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-israel:test123@cluster0.ibsze.mongodb.net/todolistDB?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema = {
  name: String
};

const Task = mongoose.model("Task", itemsSchema);

const groceries = new Task({
  name: "Buy groceries"
});

const dog = new Task({
  name: "Walk the dogs"
});

const bills = new Task({
  name: "Pay the light bills"
});
// default task.
const defaultTask = [groceries, dog, bills];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  // check to see if the the list is empty or there is  an error and add task default task if it's empty.
  Task.find((err, task) => {
    if (task.length === 0) {
      Task.insertMany(defaultTask, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added the task.");
        }
      })
      res.redirect("/");
    }
    //use ejs to render the html template to the home screen.
    res.render("list", {
      listTitle: "Today",
      newListItems: task
    });
  })
});

app.get("/:customListName", (req, res) => {

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, (err, result) => {
    if (err) {
      console.log(err);
    }
    if (!result) {
      const list = new List({
        name: customListName,
        items: defaultTask
      });
      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {
        listTitle: result.name,
        newListItems: result.items
      });
    }
  })
})

app.post("/", function(req, res) {
  // this get user imput.
  const taskName = req.body.newItem;
  const listName = req.body.list;

  // put the user input into our schema.
  const tasks = new Task({
    name: taskName
  });

  if (listName === "Today") {
    //save the new task
    tasks.save();
    //redirect to the home page to add the new task.
    res.redirect("/");
  }else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(tasks);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", (req, res) => {
  //get the item id that is check
  const itemCheckedId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    //find and delete the item based on the id.
    Task.findByIdAndDelete({_id: itemCheckedId}, (err) => {});
    res.redirect("/")
  }else {
    // find the item from our custom list and delete it.
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemCheckedId} }}, (err, foundItem) => {
      res.redirect("/" + listName);
    })
  }
})

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(port, function() {
  console.log("Server started on port 3000");
});
