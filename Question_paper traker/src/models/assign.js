const mongoose=require("mongoose")
const assign =mongoose.Schema({
    courseName:{
        type:String,
        required:false
    },
    email:{
        type:String,
        required:false
    },
    courseCode:{
        type:String,
        require:false
    },
    facultyName:{
        type:String,
        require:false
    },
    Status: {
        type: String,
        default: "Not Submitted"
    },
    file:{
        type:String,
        require:false
    }
})
const details=new mongoose.model("assign",assign)
module.exports=details