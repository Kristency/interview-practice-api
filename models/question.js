const mongoose = require('mongoose')
const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching')

const questionSchema = new mongoose.Schema(
	{
		_id: Number,
		name: { type: String, text: true },
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
	},
	{ toObject: { versionKey: false } }
)

questionSchema.plugin(mongoose_fuzzy_searching, { fields: [{ name: 'name', minSize: 4 }] })

module.exports = mongoose.model('Question', questionSchema)
