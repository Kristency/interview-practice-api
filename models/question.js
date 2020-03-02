const mongoose = require('mongoose')

const questionSchema = new mongoose.Schema({
	name: String,
	row: Number,
	link: String,
	category: String,
	difficulty: String,
	solutions: [
		{
			_id: false,
			link: String,
			user_column: String
		}
	]
})

module.exports = mongoose.model('Question', questionSchema)
