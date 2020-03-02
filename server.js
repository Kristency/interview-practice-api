const express = require('express')
const app = express()
require('dotenv').config()

const cors = require('cors')
const { GoogleSpreadsheet } = require('google-spreadsheet')
const env = require('env-var')
const doc = new GoogleSpreadsheet(process.env.SHEET_ID)

const mongoose = require('mongoose')
mongoose.connect(process.env.DATABASEURL || 'mongodb://localhost:27017/interview-practice', {
	useNewUrlParser: true,
	useUnifiedTopology: true
})

// mongoose.connect('mongodb://localhost:27017/interview-practice', {
// 	useNewUrlParser: true,
// 	useUnifiedTopology: true
// })

const PORT = process.env.PORT || 8080

app.use(cors())
app.use(express.json())

// requiring models
const User = require('./models/user')
const Question = require('./models/question')

app.get('/repopulate_questions', async (req, res) => {
	try {
		await Question.collection.drop()

		await doc.useServiceAccountAuth({
			client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
			private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') /* giving error in .env file due to newlines */
		})
		await doc.loadInfo()
		const sheet = doc.sheetsByIndex[0]

		const ZERO_BASED_ROW_INDEX_START = env.get('ZERO_BASED_ROW_INDEX_START').asInt()
		const ZERO_BASED_ROW_INDEX_END = env.get('ZERO_BASED_ROW_INDEX_END').asInt()
		const ZERO_BASED_USER_COLUMN_START = env.get('ZERO_BASED_USER_COLUMN_START').asInt()
		const ZERO_BASED_USER_COLUMN_END = env.get('ZERO_BASED_USER_COLUMN_END').asInt()

		let startRowA1Index = ZERO_BASED_ROW_INDEX_START + 1
		let endRowA1Index = ZERO_BASED_ROW_INDEX_END + 1
		let startColumnA1Index = String.fromCharCode(65)
		let endColumnA1Index = String.fromCharCode(65 + ZERO_BASED_USER_COLUMN_END)

		await sheet.loadCells(`${startColumnA1Index}${startRowA1Index}:${endColumnA1Index}${endRowA1Index}`)

		let name, row, link, category, difficulty
		let solutions = []

		for (let i = ZERO_BASED_ROW_INDEX_START; i <= ZERO_BASED_ROW_INDEX_END; i++) {
			name = sheet.getCell(i, 0).value
			row = i + 1
			link = sheet.getCell(i, 1).value
			category = sheet.getCell(i, 2).value
			difficulty = sheet.getCell(i, 3).value
			solutions = []
			for (let j = ZERO_BASED_USER_COLUMN_START; j <= ZERO_BASED_USER_COLUMN_END; j++) {
				solution = sheet.getCell(i, j).value
				if (solution) {
					solutions.push({ link: solution, user_column: String.fromCharCode(65 + j) })
				}
			}
			await Question.create({ name, row, link, category, difficulty, solutions })
		}
		console.log('Done')
		res.json('Done')
	} catch (err) {
		if (err.message !== 'ns not found') {
			res.json({ error: err.message })
		}
	}
})

app.get('/repopulate_users', async (req, res) => {
	try {
		await User.collection.drop()
		const users = [
			{ name: 'Anubhav', column: 'E' },
			{ name: 'Subhajit', column: 'F' },
			{ name: 'Manas', column: 'G' },
			{ name: 'Abhimanyu', column: 'H' },
			{ name: 'Sourabh', column: 'I' },
			{ name: 'Akshat', column: 'J' },
			{ name: 'Mohit', column: 'K' },
			{ name: 'Samrat', column: 'L' }
		]

		await User.create(users)
		res.json('Done')
	} catch (err) {
		if (err.message !== 'ns not found') {
			res.json({ error: err.message })
		}
	}
})

app.get('/users', async (req, res) => {
	try {
		let foundUsers = await User.find({}, { _id: 0, __v: 0 })
		res.json(foundUsers)
	} catch (err) {
		res.json({ error: err.message })
	}
})

app.get('/questions', async (req, res) => {
	try {
		let foundQuestions = await Question.find({}, { _id: 0, __v: 0 })
		res.json(foundQuestions)
	} catch (err) {
		res.json({ error: err.message })
	}
})

app.post('/questions', async (req, res) => {
	let { name, problem_link, category, difficulty, user_column, solution_link } = req.body
	let solutions = [{ link: solution_link, user_column }]
	let newQuestion = { name, link: problem_link, category, difficulty, solutions }
	try {
		await doc.useServiceAccountAuth({
			client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
			private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') /* giving error in .env file due to newlines */
		})
		await doc.loadInfo()
		const sheet = doc.sheetsByIndex[0]
		let foundQuestion = await Question.findOne({ link: problem_link })
		let flag = false
		if (foundQuestion) {
			for (let solution of foundQuestion.solutions) {
				if (solution.user_column === user_column) {
					flag = true
					solution.link = solution_link
					await foundQuestion.save()
				}
			}
			if (flag === true) {
				delete foundQuestion._id
				delete foundQuestion.__v
				res.json(foundQuestion)
			} else {
				let updatedQuestion = await Question.findOneAndUpdate(
					{ link: problem_link },
					{ $push: { solutions: { link: solution_link, user_column } } }
				)
				delete updatedQuestion._id
				delete updatedQuestion.__v
				res.json(updatedQuestion)
			}

			let rowA1Index = foundQuestion.row.toString()
			await sheet.loadCells(`${user_column}${rowA1Index}:${user_column}${rowA1Index}`)
			const solutionCell = sheet.getCellByA1(`${user_column}${rowA1Index}`)
			solutionCell.value = solution_link
			await solutionCell.save()
		} else {
			const newRow = await sheet.addRow({
				'Problem Name': name,
				'Problem Link': problem_link,
				Category: category,
				Difficulty: difficulty
			})
			let newRowA1Index = newRow.rowIndex
			// console.log(typeof newRowA1Index)

			let createdQuestion = await Question.create({ ...newQuestion, row: newRowA1Index })
			delete createdQuestion._id
			delete createdQuestion.__v
			res.json(createdQuestion)

			let userColumnStart = String.fromCharCode(65 + env.get('ZERO_BASED_USER_COLUMN_START').asInt())
			let userColumnEnd = String.fromCharCode(65 + env.get('ZERO_BASED_USER_COLUMN_END').asInt())
			await sheet.loadCells(`${userColumnStart}${newRowA1Index}:${userColumnEnd}${newRowA1Index}`)
			const solutionCell = sheet.getCellByA1(`${user_column}${newRowA1Index}`)
			solutionCell.value = solution_link
			await solutionCell.save()
		}
	} catch (err) {
		res.json({ error: err.message })
	}
})

app.patch('/questions', async (req, res) => {
	let { row, user_column, solution_link } = req.body
	// console.log(row)
	try {
		await doc.useServiceAccountAuth({
			client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
			private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') /* giving error in .env file due to newlines */
		})
		await doc.loadInfo()
		const sheet = doc.sheetsByIndex[0]
		let foundQuestion = await Question.findOne({ row })
		// console.log(foundQuestion)
		let flag = false
		for (let solution of foundQuestion.solutions) {
			if (solution.user_column === user_column) {
				flag = true
				solution.link = solution_link
				await foundQuestion.save()
			}
		}
		if (flag === true) {
			delete foundQuestion._id
			delete foundQuestion.__v
			res.json(foundQuestion)
		} else {
			let updatedQuestion = await Question.findOneAndUpdate({ row }, { $push: { solutions: { link: solution_link, user_column } } })
			// console.log(updatedQuestion)
			delete updatedQuestion._id
			delete updatedQuestion.__v
			res.json(updatedQuestion)
		}

		let rowA1Index = row.toString()
		await sheet.loadCells(`${user_column}${rowA1Index}:${user_column}${rowA1Index}`)
		const solutionCell = sheet.getCellByA1(`${user_column}${rowA1Index}`)
		solutionCell.value = solution_link
		await solutionCell.save()
	} catch (err) {
		res.json({ error: err.message })
	}
})

app.listen(PORT, () => {
	console.log(`Your app is listening on port ${PORT}`)
})
