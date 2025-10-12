import mongoose, {Schema, Types} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
const VideoSchema = new Schema(
    {
        VideoFile : {
            type: String, //cloudinary url
            required : true,
        },
        thumbnail : {
            type: String, //cloudinary url
            required : true,
        },
        title : {
            type :String,
            required : true
        },
        description : {
            type : String,
            required : true,
        },
        views : {
            type : Number,
            default : 0
        },
        duration :{
            type : Number,
            required : true
        },
        isPublished : {
            type : Boolean,
            default : true
        },
        owner :{
            type : Schema.Types.ObjectId,
            ref : "User"
        }
    },{timestamps : true}
)

VideoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video",VideoSchema)