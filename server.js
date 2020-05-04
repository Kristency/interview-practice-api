const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.DATABASEURL || 'mongodb://localhost:27017/interview-practice', {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useCreateIndex: true
})

// mongoose.connect('mongodb://localhost:27017/interview-practice', {
// 	useNewUrlParser: true,
// 	useUnifiedTopology: true,
// 	useCreateIndex: true
// })

const PORT = process.env.PORT || 8080

app.use(cors())
app.use(express.json())

// requiring models
const User = require('./models/user')
const Question = require('./models/question')

// requiring routes
const questionRoutes = require('./routes/question')
const seedRoutes = require('./routes/seeds')

app.get('/user', async (req, res) => {
	let { email } = req.query
	try {
		let foundUser = await User.findOne({ email }, { __v: 0 }).lean()
		res.json(foundUser)
	} catch (err) {
		res.json({ error: err.message })
	}
})

/* this route stops working after call to /repopulate_questions route.
	To make it work again, deploy the server again on heroku every time you repopulate the db.
	I know, it sucks. */
app.get('/search', async (req, res) => {
	let { search_query } = req.query
	try {
		let matchedQuestions = await Question.fuzzySearch(search_query).lean()
		res.json(matchedQuestions)
	} catch (err) {
		res.json({ error: err.message })
	}
})

app.use('/questions', questionRoutes)
app.use(seedRoutes)

app.listen(PORT, () => {
	console.log(`Your app is listening on port ${PORT}`)
})

//Done everything
