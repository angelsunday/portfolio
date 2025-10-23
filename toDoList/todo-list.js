    //Main Idea of Javascript
    // 1.Save the data
    // 2.generate the HTML
    // 3.Make it interactive



const todoList = [{
  name:'make dinner',  
  dueDate: '08-04-2025'}, {
    name:'wash dishes',
    dueDate: '08-04-2025'
  }];

renderTodoList();

function renderTodoList(){
//Put the HTML on web Page
let todoListHTML = '';

//Loop through the array
//Generating the HTML technique
for(let i = 0; i < todoList.length; i++){
  const todoObject = todoList[i];
  //const name = todoObject.name;
  //const dueDate = todoObject.dueDate;
  const { name, dueDate } = todoObject;
  //Create some HTML code for each todo
  const html = `
  
    <div>${name}</div>
    <div>${dueDate}</div>
    <button onclick="
    todoList.splice(${i}, 1);
    renderTodoList();" class="delete-todo-button"
  >Delete
  </button>
  `;
  //put the HTML on web page
  todoListHTML += html;
}


//put the div element inside our javascript

document.querySelector('.js-todo-list')
.innerHTML = todoListHTML;//Take the HTML we created into the loop and put it in the div element
//They show up on the page
}
function addTodo(){
  const inputElement = document.querySelector('.js-name-input');
  const name = inputElement.value;
  const dateInputElement = document.querySelector('.js-due-date-input');
  const dueDate = dateInputElement.value;
  
  todoList.push({
    name: name,
    dueDate: dueDate
  });
  

  inputElement.value = '';

  renderTodoList();
}