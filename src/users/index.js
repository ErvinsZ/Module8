const express = require("express")
const q2m = require("query-to-mongo")
const { authenticate, refreshToken } = require("./authTools")
const { authorize } = require("./auth")

const UserModel = require("./schema")

const usersRouter = express.Router()

usersRouter.get("/", authorize, async (req, res, next) => {
  try {
    const query = q2m(req.query)
    const users = await UserModel.find(query.criteria, query.options.fields)
      .skip(query.options.skip)
      .limit(query.options.limit)
      .sort(query.options.sort)

    res.send(users)
  } catch (error) {
    console.log(error)
    next(error)
  }
})

usersRouter.get("/me", authorize, async (req, res, next) => {
  try {
    res.send(req.user)
  } catch (error) {
    next("While reading users list a problem occurred!")
  }
})

usersRouter.post("/register", async (req, res, next) => {
  try {
    const newUser = new UserModel(req.body)
    const { _id } = await newUser.save()

    res.status(201).send(_id)
  } catch (error) {
    next(error)
  }
})

usersRouter.put("/me", authorize, async (req, res, next) => {
  try {
    const updates = Object.keys(req.body)

    try {
      updates.forEach((update) => (req.user[update] = req.body[update]))
      await req.user.save()
      res.send(req.user)
    } catch (e) {
      res.status(400).send(e)
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.delete("/me", authorize, async (req, res, next) => {
  try {
    await req.user.remove()
    res.send("Deleted")
  } catch (error) {
    next(error)
  }
})

usersRouter.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body
    const user = await UserModel.findByCredentials(username, password)
    const tokens = await authenticate(user)
    res.send(tokens)
  } catch (error) {
    next(error)
  }
})

usersRouter.post("/logout", authorize, async (req, res, next) => {
  try {
    req.user.refreshTokens = req.user.refreshTokens.filter(
      (t) => t.token !== req.body.refreshToken
    )
    await req.user.save()
    res.send()
  } catch (err) {
    next(err)
  }
})

usersRouter.post("/logoutAll", authorize, async (req, res, next) => {
  try {
    req.user.refreshTokens = []
    await req.user.save()
    res.send()
  } catch (err) {
    next(err)
  }
})

usersRouter.post("/refreshToken", async (req, res, next) => {
  const oldRefreshToken = req.body.refreshToken
  if (!oldRefreshToken) {
    const err = new Error("Forbidden")
    err.httpStatusCode = 403
    next(err)
  } else {
    try {
      const newTokens = await refreshToken(oldRefreshToken)
      res.send(newTokens)
    } catch (error) {
      console.log(error)
      const err = new Error(error)
      err.httpStatusCode = 403
      next(err)
    }
  }
})

module.exports = usersRouter