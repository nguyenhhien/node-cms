var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;

var conversationSchema = new Schema({
    users: [
        {
            id: String,
            avatar: String,
            joinedDate: Date,
            leftDate: Date
        }
    ],
    numPages: Number
});

var Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;