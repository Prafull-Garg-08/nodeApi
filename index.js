const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const db = require('./db')
const port = 3000

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

app.get('/', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' })
})


app.get('/users', db.getUsers) //localhost:3000/users
app.post('/users', db.createUser)

// endpoint to create the 'users' table
app.post('/create-table', db.createTable);



app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})