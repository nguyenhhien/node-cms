var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;

var commentSchema = new Schema({
    objectId: String,
    collectionName: String,
    name: String,
    slug: String,
    fullSlug: String,
    rating: Number,
    posted: Date,
    updated: Date,
    parentId: String,
    parent: {
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    },
    author: {
        id: Number,
        name: String,
        avatar: String,
        email: String
    },
    text: String
});

var Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;