
/******************************************************************************
 ** Post Form
 ** Sources: http://eecs.oregonstate.edu/ecampus-video/CS290/core-content/
 **           ajax-forms/js-forms.html
 **         http://eecs.oregonstate.edu/ecampus-video/CS290/core-content/ajax-
 **           forms/async-requests.html
 **         https://eloquentjavascript.net/18_http.html
 **         https://stackoverflow.com/questions/24333752/bootstrap-form-input-
 **           prevent-submit-but-allow-for-input-checking User: Ed Fryed
 ******************************************************************************/

document.addEventListener('DOMContentLoaded', bindButtons);

function bindButtons(){
    var request = new XMLHttpRequest();
    var data={};
    //If home load table
    if(window.location.href != "http://flip3.engr.oregonstate.edu:9584/edit-item.html"){

    data.loadTable = true;
    request.open("POST", "http://flip3.engr.oregonstate.edu:9584", true);
    request.setRequestHeader("content-type", "application/json");
    request.addEventListener('load', function(){
      if(request.status >= 200 && request.status <400){  
        //Source:
        //https://www.w3schools.com/js/js_window_location.asp
          var tableData = Object.values(JSON.parse(request.response));
          addTable(tableData);
      }
      else{
        console.log("Error: " + request.status);
      } 
    });
    request.send(JSON.stringify(data));
    }
    else{
      // If edit page get and set default values
          request.open("POST", "http://flip3.engr.oregonstate.edu:9584/edit-item.html", true);
          request.setRequestHeader("content-type", "application/json");
          request.addEventListener('load', function(){
            if(request.status >= 200 && request.status <400){
              setDefaults(JSON.parse(request.response));         
            }
            else{
              console.log("Error: " + request.status);
            }  
          });
          request.send();
    }
  // Bind Buttons
  document.body.addEventListener('submit', 
   function(event){
    event.preventDefault();
    //Source: https://www.daolf.com/posts/things-to-know-js-events/
    var buttonType = event.target.lastElementChild.value;
    var itemId = event.target.firstElementChild.id;
    var request = new XMLHttpRequest();
    var data = {};

    if(buttonType == "Add" || "Update"){
      var radioElements = document.getElementsByName("units");
      data.name = document.getElementById('name').value;;
      data.reps = document.getElementById('reps').value;
      data.weight = document.getElementById('weight').value;
      data.dateDone = document.getElementById('dateDone').value;
      data.units = getRadioValue(radioElements);
      if(buttonType == "Add"){
       data.Add = true;
      } 
      if(buttonType == "Update"){
        data.id = document.getElementById("updateId").value;
        data.Update = true;
      } 
    }

    if(buttonType == "CLEAR ALL DATA"){
      data.Reset = true;
    } 

    if(buttonType == "Delete"){
      data.id = document.getElementById(itemId).value;
      data.Delete = true;
    } 

    if(buttonType != "Edit"){
    // Send and Read Data
    request.open("POST", "http://flip3.engr.oregonstate.edu:9584", true);
    request.setRequestHeader("content-type", "application/json");
    request.addEventListener('load', function(){
      if(request.status >= 200 && request.status <400){
        if(buttonType == "Update"){
          window.location.href = "http://flip3.engr.oregonstate.edu:9584";
        }
        else if(buttonType == "CLEAR ALL DATA"){
          var isTable = document.body.getElementsByTagName("table").length>0;
          if(isTable){
            var table = document.querySelector("table");
            removeTable(table);
          }
        }
        else{
          //Source: 
          //https://www.geeksforgeeks.org/remove-all-the-child-elements-of-a-dom-node-in-javascript/
          var isTable = document.body.getElementsByTagName("table").length>0;
          if(isTable){
            var table = document.querySelector("table");
            removeTable(table);
          }
          var tableData = Object.values(JSON.parse(request.response));
          addTable(tableData);
        }
      }
      else{
        console.log("Error: " + request.status);
      }
    }); 
    request.send(JSON.stringify(data));
    }
    else if(buttonType == "Edit"){
      sendItem(itemId);
    }
});
}

// Source: https://stackoverflow.com/questions/604167/
//  how-can-we-access-the-value-of-a-radio-button-using-the-dom
function getRadioValue(elements){
  for (var i = 0, l = elements.length; i < l; i++)
  {
    if (elements[i].checked)
    {
      return elements[i].value;
    }
  }
}

function sendItem(itemId){
  eData = {};
  eData.id = document.getElementById(itemId).value;
  eData.Edit = true;
  var request = new XMLHttpRequest();
  request.open("POST", "http://flip3.engr.oregonstate.edu:9584", true);
  request.setRequestHeader("content-type", "application/json");
  request.addEventListener('load', function(){
    if(request.status >= 200 && request.status <400){
      window.location.href = "http://flip3.engr.oregonstate.edu:9584/edit-item.html";
    }
    else{
      console.log("Error: " + request.status);
    }       
  });
  request.send(JSON.stringify(eData));
}

function setDefaults(itemVal){
  var fieldIds = ["updateId","name","reps","weight","dateDone","kg","lb"];
  var defaults = [itemVal[0].id, itemVal[0].name, itemVal[0].reps, itemVal[0].weight, itemVal[0].dateDone, itemVal[0].isKg, itemVal[0].isLb]; 
  for(var i of fieldIds.keys()){
    if((fieldIds[i] != "kg") && (fieldIds[i] != "lb")){
      var currElement = document.getElementById(fieldIds[i]);
      currElement.setAttribute("value",defaults[i]);
    }
    else if(itemVal[0].units == "kg"){
      currElement = document.getElementById(fieldIds[5]);
      currElement.setAttribute("checked","");
    }
    else if(itemVal[0].units == "lb"){
      currElement = document.getElementById(fieldIds[6]);
      currElement.setAttribute("checked","");
    }
  }
}

function removeTable(table){
  var child = table.lastElementChild;  
  while (child) { 
    table.removeChild(child); 
    child = table.lastElementChild;
  } 
  document.body.removeChild(table);
}

function addTable(tableData){
  if(tableData.length >=1){
  //Create Table
  var newTable = document.createElement("table");
  //Add Table Header
  var newHead = document.createElement("thead");
  newTable.appendChild(newHead);
  var newRow = document.createElement("tr");
  newHead.appendChild(newRow); 
  var itemKeys = ["Action","Name", "Reps", "Weight", "Date Completed", "Units"];       
  for(var key of itemKeys){
    var newItem = document.createElement("th");
    newItem.textContent = key;
    if(key == "Action"){
newItem.setAttribute("colspan", "2");
    }
    newRow.appendChild(newItem);
  }
  //Add Cells
  for(var item of tableData){
    var newRow = document.createElement("tr");
    newTable.appendChild(newRow);    
    //Source:
    //https://stackoverflow.com/questions/684672/how-do-i-loop-through-or-enumerate-a-javascript-object
    for(var key in item){
      if((item.hasOwnProperty(key))&&(key == "name" || key == "reps" || key == "weight" || key == "dateDone" || key == "units")){   
        var newItem = document.createElement("td");
        newItem.textContent = item[key];
        newRow.appendChild(newItem);      
      }
      else if((key == "id") && (item.hasOwnProperty(key))){
        var forms = ["Delete", "Edit"]
        var hiddenAtts = ["type", "name", "id", "value"];
        var buttonAtts = ["type", "name", "value"];
        var hiddenVals = ["hidden", "id", item["id"], item["id"]];
      
        for(type of forms){
          var buttonVals = ["submit", type, type];
          var newItem = document.createElement("td");
          newRow.appendChild(newItem);
          var newForm = document.createElement("form");
          newItem.appendChild(newForm);
          var newInput = document.createElement("input");
          //Source:
          //https://stackoverflow.com/questions/34348937/access-to-es6-array-element-index-inside-for-of-loop
          for(var i of hiddenAtts.keys()){
            newInput.setAttribute(hiddenAtts[i], hiddenVals[i]);
          }
          newForm.appendChild(newInput);
          var newButton = document.createElement("input")
          for(var i of buttonAtts.keys()){
            newButton.setAttribute(buttonAtts[i], buttonVals[i]);
          };
          newForm.appendChild(newButton);
        }
        newRow.appendChild(newItem);
      }
    }
  }
  //Append Table
  document.body.appendChild(newTable);
  }
  else{
    console.log("table empty");
  }
}


