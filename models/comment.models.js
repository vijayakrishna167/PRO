import mongoose,{Schema} from mongoose
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";

const CommentSchema  = new mongoose.model(
    {
        content :{
            type: String,
            required : true
        },
        video :{
            type : Schema.Types.ObjectId,
            ref : "Video"
        },
        owner :{
            type : Schema.Types.ObjectId,
            ref: "User"
        }
    },{
        timestamps: true
    }
)
CommentSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model("Comment", CommentSchema)