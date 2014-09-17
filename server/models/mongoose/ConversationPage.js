var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;

var conversationPage = new Schema({
    conversationId: {
        type: Schema.Types.ObjectId,
        ref: 'Conversation'
    },
    page: Number,
    count: Number,
    messages: [
        {
            userId: String,
            postedDate: Date,
            content: String,
            isDeleted: Number,
            page: Number
        }
    ]
});

var ConversationPage = mongoose.model('ConversationPage', conversationPage);

module.exports = ConversationPage;