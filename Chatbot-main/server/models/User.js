

// phone


const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // User's full name
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  // User's email address
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  
  // User's phone number with country code
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    // validate: {
    //   validator: function(v) {
    //     return /^\+[1-9]\d{1,14}$/.test(v);
    //   },
    //   message: props => `${props.value} is not a valid phone number with country code!`
    // }
  },
  
  // Country code
  countryCode: {
    type: String,
    required: true
  },
  
  // Timestamp when user was created (Indian timezone)
  createdAt: {
    type: String,
    default: () => new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual property to get user's initials
userSchema.virtual('initials').get(function() {
  return this.name.split(' ').map(n => n[0]).join('').toUpperCase();
});

// Middleware to update timestamps before saving
userSchema.pre('save', function(next) {
  if (!this.createdAt) {
    this.createdAt = new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  next();
});

// Static method to find users by name pattern
userSchema.statics.findByName = function(name) {
  return this.find({ name: new RegExp(name, 'i') });
};

module.exports = mongoose.model('User', userSchema);




