var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;
var Q               = require('q');

var commentSchema = new Schema({
    discussionId: String,
    discussionName: String,
    title: String,
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