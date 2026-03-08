import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    passwordHash: {
        type: String,
        required: true
    },
    stats: {
        gamesPlayed: { type: Number, default: 0 },
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        draws: { type: Number, default: 0 },
        elo: { type: Number, default: 1200 }
    },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now }
    });

    // Hash password before saving
    userSchema.pre('save', async function(next) {
    if (!this.isModified('passwordHash')) return next();
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
    // next();
    });

    // Compare password method
    userSchema.methods.comparePassword = async function(password) {
    return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model('User', userSchema);