import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI is not defined in your .env file.');
  process.exit(1);
}

// User Schema stub for script use
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function run() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  await mongoose.connect(MONGODB_URI!);

  try {
    switch (command) {
      case '--count': {
        const count = await User.countDocuments();
        console.log(`📊 Total Users in Database: ${count}`);
        break;
      }
      case '--list': {
        const users = await User.find({}, 'email role createdAt');
        console.log('👤 Registered Users List:');
        console.table(users.map(u => ({
          ID: u._id.toString(),
          Email: u.email,
          Role: u.role,
          Joined: u.createdAt
        })));
        break;
      }
      case '--create': {
        const email = args[1];
        const password = args[2];
        if (!email || !password) {
          console.error('❌ Error: Please provide both email and password.\nExample: npm run db-tool -- --create email@test.com mypass123');
          break;
        }
        const existing = await User.findOne({ email });
        if (existing) {
          console.error('❌ Error: That email is already registered.');
          break;
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();
        console.log(`✅ User successfully created: ${email} (${newUser._id})`);
        break;
      }
      case '--delete': {
        const email = args[1];
        if (!email) {
          console.error('❌ Error: Please specify the email to delete.\nExample: npm run db-tool -- --delete email@test.com');
          break;
        }
        const result = await User.deleteOne({ email });
        if (result.deletedCount === 0) {
          console.log(`❓ No user found with email: ${email}`);
        } else {
          console.log(`🗑️ Successfully deleted user: ${email}`);
        }
        break;
      }
      default: {
        console.error(`❌ Unknown command: ${command}`);
        printHelp();
      }
    }
  } catch (error) {
    console.error('💥 Execution error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

function printHelp() {
  console.log(`
🛠️ Invivizimo Database CLI Tool
Usage: npm run db-tool -- [options]

Options:
  --count                      Count total registered users
  --list                       List all registered users details
  --create <email> <password>  Create a new user directly in DB
  --delete <email>             Delete a user by email
  --help, -h                   Show this help menu
`);
}

run();
