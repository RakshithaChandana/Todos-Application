const express = require("express");
const app = express();
app.use(express.json());

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const convertDbObjectAPIs = (objectItem) => {
  return {
    id: objectItem.id,
    todo: objectItem.todo,
    priority: objectItem.priority,
    status: objectItem.status,
    category: objectItem.category,
    dueDate: objectItem.due_date,
  };
};

//API 1
app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority, category } = request.query;
  let data = null;
  let getTodosQuery = "";
  switch (true) {
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `
            SELECT * FROM todo WHERE status="${status}" AND 
            todo LIKE '%${search_q}%';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((item) => convertDbObjectAPIs(item)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `
            SELECT * FROM todo WHERE priority="${priority}" AND 
            todo LIKE '%${search_q}%' ;`;
        data = await db.all(getTodosQuery);
        response.send(data.map((item) => convertDbObjectAPIs(item)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
            SELECT * FROM todo WHERE status="${status}" AND
            priority="${priority}" AND todo LIKE '%${search_q}%';`;
          data = await db.all(getTodosQuery);
          response.send(data.map((item) => convertDbObjectAPIs(item)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case hasCategoryAndStatusProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
            SELECT * FROM todo WHERE status="${status}" AND
            category="${category}" AND todo LIKE '%${search_q}%';`;
          data = await db.all(getTodosQuery);
          response.send(data.map((item) => convertDbObjectAPIs(item)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `
            SELECT * FROM todo WHERE
            category="${category}" AND todo LIKE '%${search_q}%';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((item) => convertDbObjectAPIs(item)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    case hasCategoryAndPriorityProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `
            SELECT * FROM todo WHERE
            category="${category}" AND todo LIKE '%${search_q}%' 
            AND priority="${priority}";`;
          data = await db.all(getTodosQuery);
          response.send(data.map((item) => convertDbObjectAPIs(item)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasSearchProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE todo LIKE '%${search_q}%';`;
      data = await db.all(getTodosQuery);
      response.send(data.map((item) => convertDbObjectAPIs(item)));

      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo ;`;
      data = await db.all(getTodosQuery);
      response.send(data.map((item) => convertDbObjectAPIs(item)));
  }
});

//API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id="${todoId}";`;
  const getTodoQueryResponse = await db.get(getTodoQuery);
  response.send(convertDbObjectAPIs(getTodoQueryResponse));
});

//API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const getDateQuery = `SELECT * FROM todo WHERE due_date='${newDate}';`;
    const getDateQueryResponse = await db.all(getDateQuery);
    response.send(
      getDateQueryResponse.map((item) => convertDbObjectAPIs(item))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `INSERT INTO todo (id,todo,priority,status,category,due_date)
            VALUES ("${id}","${todo}","${priority}","${status}","${category}","${newDate}");`;
          await db.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  const previousTodoQuery = `SELECT * FROM todo WHERE id="${todoId}";`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      if (
        requestBody.status === "TO DO" ||
        requestBody.status === "IN PROGRESS" ||
        requestBody.status === "DONE"
      ) {
        updateColumn = "Status";
        const updateTodoQuery = `UPDATE todo
            SET status="${status}",
                priority="${priority}",
                todo="${todo}",
                category="${category}",
                due_date="${dueDate}"
            WHERE id="${todoId}";`;
        const updateQueryResponse = await db.run(updateTodoQuery);
        response.send(`${updateColumn} Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;
    case requestBody.priority !== undefined:
      if (
        requestBody.priority === "HIGH" ||
        requestBody.priority === "MEDIUM" ||
        requestBody.priority === "LOW"
      ) {
        updateColumn = "Priority";
        const updateTodoQuery = `UPDATE todo
        SET status="${status}",
            priority="${priority}",
            todo="${todo}",
            category="${category}",
            due_date="${dueDate}"
        WHERE id="${todoId}";`;
        const updateQueryResponse = await db.run(updateTodoQuery);
        response.send(`${updateColumn} Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      const updateTodoQuery = `UPDATE todo
        SET status="${status}",
            priority="${priority}",
            todo="${todo}",
            category="${category}",
            due_date="${dueDate}"
        WHERE id="${todoId}";`;
      const updateQueryResponse = await db.run(updateTodoQuery);
      response.send(`${updateColumn} Updated`);
      break;
    case requestBody.dueDate !== undefined:
      if (isMatch(requestBody.dueDate, "yyyy-MM-dd")) {
        updateColumn = "Due Date";
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        const updateTodoQuery = `UPDATE todo
            SET status="${status}",
                priority="${priority}",
                todo="${todo}",
                category="${category}",
                due_date="${newDate}"
            WHERE id="${todoId}";`;
        const updateQueryResponse = await db.run(updateTodoQuery);
        response.send(`${updateColumn} Updated`);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }

      break;
    case requestBody.category !== undefined:
      if (
        requestBody.category === "WORK" ||
        requestBody.category === "HOME" ||
        requestBody.category === "LEARNING"
      ) {
        updateColumn = "Category";
        const updateTodoQuery = `UPDATE todo
            SET status="${status}",
                priority="${priority}",
                todo="${todo}",
                category="${category}",
                due_date="${dueDate}"
            WHERE id="${todoId}";`;
        const updateQueryResponse = await db.run(updateTodoQuery);
        response.send(`${updateColumn} Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
  }
});

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM todo
  WHERE id='${todoId}';`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
