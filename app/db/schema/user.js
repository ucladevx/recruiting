const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const _ = require('underscore');

const SALT_ROUNDS = 8;

module.exports = mongoose => {
  /*********************************
   * SCHEMA
   *********************************/

  const UserSchema = new mongoose.Schema({
    id: {
      type: String,
      index: true,
      unique: true,
      default: () => uuid.v4().split('-').pop(),
    },
    email: {
      type: String,
      lowercase: true,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    hash: {
      type: String,
      required: true,
    },
    accountCreated: {
      type: Date,
      default: () => new Date(),
    },
    lastLogin: {
      type: Date,
    },
    state: {
      type: String,
      default: 'ACTIVE',
      enum: {
        values: ['ACTIVE', 'BLOCKED'],
        message: 'Invalid account state: `{VALUE}`',
      }
    },
    accessType: {
      type: String,
      default: 'STANDARD',
      enum: {
        values: ['STANDARD', 'ADMIN', 'RESTRICTED'],
        message: 'Invalid access type: `{VALUE}`',
      }
    }
  });

  /*********************************
   * STATICS
   *********************************/

  UserSchema.statics.findByEmail = function(email) {
    const promise = this.findOne({ email }).exec();
    console.log(promise);
    return promise;
  };

  UserSchema.statics.findById = function(id) {
    return this.findOne({ id }).exec();
  };

  UserSchema.statics.generateHash = function(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
  };

  /*********************************
   * METHODS
   *********************************/

  UserSchema.methods.verifyPassword = function(password) {
    return bcrypt.compare(password, this.hash);
  }

  UserSchema.methods.isAdmin = function() {
    return this.accessType === 'ADMIN';
  }

  /*********************************
   * CREATE MODEL
   *********************************/

  const User = mongoose.model('User', UserSchema);

  /*********************************
   * VALIDATORS
   *********************************/

  User.schema.path('email').validate(value => {
    return /^.{2,}\@([^\.\@]{1,}\.)*ucla\.edu$/.test(value);
  }, 'A valid UCLA email is required.');

  User.schema.path('email').validate((value, respond) => {
    User
      .findByEmail(value)
      .then(user => respond(!user))
      .catch(err => respond(true));
  }, 'This email is already registered');

  return User;
}