const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({

  username:{
    type:String,
    default:""
  },

  fullName:{
    type:String,
    required:true
  },

  email:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true
  },

  mobile:{
    type:String,
    default:""
  },

  password:{
    type:String,
    required:true
  },

  isBlocked:{
    type:Boolean,
    default:true
  },

  isApproved:{
    type:Boolean,
    default:false
  },

  role:{
    type:String,
    default:"student",
    enum:["student","admin","teacher","superadmin"]
  },

  globalStatus:{
    type:String,
    default:"active",
    enum:["active","inactive"]
  },

  schoolId:{
    type:String,
    default:null
  },

  class:{
    type:String,
    default:""
  },

  createdAt:{
    type:Date,
    default:Date.now
  }

});

module.exports = mongoose.model("User", UserSchema);