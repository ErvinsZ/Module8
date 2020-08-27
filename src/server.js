const express = require("express")
const { join } = require("path")
const listEndpoints = require("express-list-endpoints")
const mongoose = require("mongoose")
const usersRouter = require("./users")
const passport = require("passport")
const morgan = require("morgan")
const cookieParser = require("cookie-parser")
const authRouter = require("./users/oauth")

const {
  notFoundHandler,
  forbiddenHandler,
  badRequestHandler,
  genericErrorHandler,
} = require("./errorHandlers")

const server = express()


const port = process.env.PORT || 3003

const staticFolderPath = join(__dirname, "../public")
server.use(express.static(staticFolderPath))
server.use(express.json())
server.use(morgan())

server.use(passport.initialize())
server.use(cookieParser())
server.use("/users", usersRouter)

server.use(badRequestHandler)
server.use(forbiddenHandler)
server.use(notFoundHandler)
server.use(genericErrorHandler)

console.log(listEndpoints(server))

mongoose
  .connect("mongodb://localhost:27017/module8-day1", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(
    server.listen(port, () => {
      console.log("Running on port", port)
    })
  )
  .catch((err) => console.log(err))