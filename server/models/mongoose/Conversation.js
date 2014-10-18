var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;

var conversationSchema = new Schema({
    users: [
        {
            id: String,
            avatar: String,
            name: String,
            email: String,
            joinedDate: Date,
            leftDate: Date
        }
    ],
    userIds: String, //concat all userIds together
    numPages: Number
});

var Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;