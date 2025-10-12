import mongoose, {Schema} from "mongoose";
const TweetSchema = new mongoose.model(
    {
        content : {
            type: String,
            required : true
        },
        owner :{
            type : Schema.Types.ObjectId,
            ref:"User"
        },
    },{timestamps : true}
)

export const Tweet = mongoose.model("Tweet", TweetSchema)