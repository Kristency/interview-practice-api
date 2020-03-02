const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
	name: String,
	column: String,
	starred: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Question'
		}
	]
})

module.exports = mongoose.model('User', userSchema)
