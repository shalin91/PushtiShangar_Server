const mongoose = require("mongoose");
const { Schema } = mongoose;

const tokenSchema = new mongoose.Schema({
  userId : {
    type: mongoose.Schema.Types.ObjectId,
    ref : "user"
  },
  customerId : {
    type: mongoose.Schema.Types.ObjectId,
    ref : "Customer"
  },
  token : {
    type : String,
  },
  createdAt : {
    type : Date,
    
  },
  expiresAt : {
    type : Date,
  }
})

const Token = mongoose.model("Token", tokenSchema);

module.exports = Token;