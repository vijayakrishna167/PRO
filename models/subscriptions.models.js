import mongoose,{Schema} from "mongoose";

const SubscriptionSchema = new mongoose.model(
    {
        subscriber :{
            type : Schema.Types.ObjectId, //one who is subscribing
            ref:"User"
        },
        channel:{
            type : Schema.Types.ObjectId, //one to whom the subscriber is subscribing
            ref : "User"
        },
    },{timestamps : true}
)

export const Subscription = mongoose.model("Subcription", SubscriptionSchema)