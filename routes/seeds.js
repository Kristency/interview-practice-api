const express = require('express')
const router = express.Router()
const env = require('env-var')

// requiring models
const User = require('../models/user')
const Question = require('../models/question')

// requiring google sheets api config
const initGoogleSheets = require('../config/googlesheets-config')

router.get('/repopulate_questions', async (req, res) => {
	try {
		await Question.collection.drop()

		const sheet = await initGoogleSheets()
		const ZERO_BASED_ROW_INDEX_START = env.get('ZERO_BASED_ROW_INDEX_START').asInt()
		const ZERO_BASED_ROW_INDEX_END = env.get('ZERO_BASED_ROW_INDEX_END').asInt()
		const ZERO_BASED_USER_COLUMN_START = env.get('ZERO_BASED_USER_COLUMN_START').asInt()
		const ZERO_BASED_USER_COLUMN_END = env.get('ZERO_BASED_USER_COLUMN_END').asInt()

		let startRowA1Index = ZERO_BASED_ROW_INDEX_START + 1
		let endRowA1Index = ZERO_BASED_ROW_INDEX_END + 1
		let startColumnA1Index = String.fromCharCode(65)
		let endColumnA1Index = String.fromCharCode(65 + ZERO_BASED_USER_COLUMN_END)

		// for usernames
		await sheet.loadCells(`${startColumnA1Index}1:${endColumnA1Index}1`)
		await sheet.loadCells(`${startColumnA1Index}${startRowA1Index}:${endColumnA1Index}${endRowA1Index}`)

		res.json('Done')
		/* sending response here because fucking heroku doesn't wait long enough to complete
		the database operations so it timeouts the request which makes it seem like I have an error in the code,
		but actually what I lack is money to buy dynos.
		This bug cost me several hours of debugging.
		Hope it will help --ME-- in the future. */

		let name, _id, link, category, difficulty
		let solutions = []

		for (let i = ZERO_BASED_ROW_INDEX_START; i <= ZERO_BASED_ROW_INDEX_END; i++) {
			name = sheet.getCell(i, 0).value
			_id = i + 1
			link = sheet.getCell(i, 1).value
			category = sheet.getCell(i, 2).value
			difficulty = sheet.getCell(i, 3).value
			solutions = []
			for (let j = ZERO_BASED_USER_COLUMN_START; j <= ZERO_BASED_USER_COLUMN_END; j++) {
				solution = sheet.getCell(i, j).value
				user_name = sheet.getCell(0, j).value
				if (solution) {
					solutions.push({ link: solution, user_column: String.fromCharCode(65 + j), user_name })
				}
			}
			await Question.create({ name, _id, link, category, difficulty, solutions })
		}
	} catch (err) {
		if (err.message !== 'ns not found') {
			res.json({ error: err.message })
		}
	}
})

router.get('/repopulate_users', async (req, res) => {
	try {
		await User.collection.drop()
		const users = [
			{ email: '17ucc071@lnmiit.ac.in', name: 'Anubhav', _id: 'E' },
			{ email: '17ucs160@lnmiit.ac.in', name: 'Subhajit', _id: 'F' },
			{ email: '17ucs081@lnmiit.ac.in', name: 'Manas', _id: 'G' },
			{ email: '17ucs005@lnmiit.ac.in', name: 'Abhimanyu', _id: 'H' },
			{ email: '17ucs159@lnmiit.ac.in', name: 'Sourabh', _id: 'I' },
			{ email: '17ucc011@lnmiit.ac.in', name: 'Akshat', _id: 'J' },
			{ email: '17dcs007@lnmiit.ac.in', name: 'Mohit', _id: 'K' },
			{ email: '17ucs136@lnmiit.ac.in', name: 'Samrat', _id: 'L' },
			{ email: '17uec020@lnmiit.ac.in', name: 'Aniket', _id: 'M' },
			{ email: '17ucs046@lnmiit.ac.in', name: 'Bhavya', _id: 'N' }
		]

		await User.create(users)
		res.json('Done')
	} catch (err) {
		if (err.message !== 'ns not found') {
			res.json({ error: err.message })
		}
	}
})

module.exports = router
