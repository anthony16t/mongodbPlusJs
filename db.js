const mongodb = require('./MongodbPlus')
const MyDbSchemas = require('./schemas')
// create database
const db = new mongodb('mongodbTodo')
// add schemas
db.addSchema(MyDbSchemas)

async function Main(){
    // start db connection
    await db.connect()
    // set collection name or update collection name
    db.setCollection('todoList')
    // fetch all my todo from todoList collection
    let allTodo = await db.findMany().toArray()
    console.log(allTodo)
    // fetch one todo from todoList collection
    const oneTodo = await db.findOne()
    console.log('<< -------- >>')
    console.log(oneTodo)
    // fetch one todo by id from todoList collection
    const oneTodoWithOjectId = await db.findOneByObjectId('61b8c4cebbc022422d8163f5')
    console.log('<< -------- >>')
    console.log(oneTodoWithOjectId)
}
Main()