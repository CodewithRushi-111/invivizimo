import { spawn } from 'child_process';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars for database validation
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

const testEmail = `test-e2e-${Math.floor(Math.random() * 100000)}@example.com`;
const testPassword = 'SecurePassword123!';

// Simple User Schema for direct DB checking
const UserSchema = new mongoose.Schema({
  email: String,
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startServer(): Promise<any> {
  console.log('🚀 Starting backend dev server for E2E tests...');
  const serverProc = spawn('npx', ['tsx', 'src/server.ts'], {
    cwd: path.resolve(__dirname, '..'),
    shell: true,
    env: { ...process.env, PORT: PORT.toString(), NODE_ENV: 'test' }
  });

  serverProc.stdout.on('data', (data) => {
    // Uncomment for raw server logging during tests
    // console.log(`[Server]: ${data}`);
  });

  serverProc.stderr.on('data', (data) => {
    console.error(`[Server Error]: ${data}`);
  });

  // Poll ready endpoint
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}/ready`);
      if (res.status === 200) {
        ready = true;
        console.log('✅ Server is ready and database is connected!');
        break;
      }
    } catch (e) {}
    await wait(1000);
  }

  if (!ready) {
    serverProc.kill();
    throw new Error('❌ Server failed to start or connect to database within 30 seconds.');
  }

  return serverProc;
}

async function runTests() {
  await mongoose.connect(MONGODB_URI!);
  console.log('🔌 Connected directly to MongoDB for validation queries.');

  let accessToken = '';
  let refreshTokenCookie = '';
  let userObjectId = '';

  console.log('\n==================================================');
  console.log(`🧪 Running E2E Test Suite for Email: ${testEmail}`);
  console.log('==================================================\n');

  try {
    // ----------------------------------------------------
    // Scenario 1: Register New User
    // ----------------------------------------------------
    console.log('🔄 Test 1: Register User (POST /auth/register)');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const regJson: any = await regRes.json();
    
    if (regRes.status === 201 && regJson.success) {
      userObjectId = regJson.data._id;
      console.log(`   └─ ✅ Success (201 Created). User ID: ${userObjectId}`);
    } else {
      throw new Error(`   └─ ❌ Failed! Status: ${regRes.status}. Error: ${JSON.stringify(regJson)}`);
    }

    // Verify DB entry
    const dbUser = await User.findOne({ email: testEmail });
    if (dbUser) {
      console.log(`   └─ 🌐 DB Validation: User exists in MongoDB (Verified!).`);
    } else {
      throw new Error('   └─ ❌ DB Validation: User does NOT exist in MongoDB!');
    }

    // ----------------------------------------------------
    // Scenario 2: Duplicate Registration Check
    // ----------------------------------------------------
    console.log('\n🔄 Test 2: Check Duplicate Registration (POST /auth/register)');
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const dupJson: any = await dupRes.json();
    if (dupRes.status === 409) {
      console.log(`   └─ ✅ Success (409 Conflict returned as expected). Message: ${dupJson.error.message}`);
    } else {
      throw new Error(`   └─ ❌ Failed! Status: ${dupRes.status}. Expected 409 Conflict.`);
    }

    // ----------------------------------------------------
    // Scenario 3: Login User (Obtain tokens)
    // ----------------------------------------------------
    console.log('\n🔄 Test 3: Log In (POST /auth/login)');
    const logRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const logJson: any = await logRes.json();
    
    if (logRes.status === 200 && logJson.success) {
      accessToken = logJson.data.accessToken;
      
      // Extract refresh cookie
      const cookies = logRes.headers.get('set-cookie');
      if (cookies && cookies.includes('refreshToken')) {
        refreshTokenCookie = cookies.split(';')[0]; // Format: refreshToken=xxx
        console.log(`   └─ ✅ Success (200 OK). Tokens successfully generated.`);
      } else {
        throw new Error('   └─ ❌ Failed! No HTTP-Only refreshToken cookie set in headers.');
      }
    } else {
      throw new Error(`   └─ ❌ Failed! Status: ${logRes.status}. Error: ${JSON.stringify(logJson)}`);
    }

    // ----------------------------------------------------
    // Scenario 4: Fetch Profile (With Authentication)
    // ----------------------------------------------------
    console.log('\n🔄 Test 4: Get Profile with Access Token (GET /users/me)');
    const profRes = await fetch(`${BASE_URL}/users/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const profJson: any = await profRes.json();
    if (profRes.status === 200 && profJson.success) {
      console.log(`   └─ ✅ Success (200 OK). Profile email: ${profJson.data.email}`);
    } else {
      throw new Error(`   └─ ❌ Failed! Status: ${profRes.status}. Error: ${JSON.stringify(profJson)}`);
    }

    // ----------------------------------------------------
    // Scenario 5: Fetch Profile (Without Authentication)
    // ----------------------------------------------------
    console.log('\n🔄 Test 5: Get Profile without Access Token (GET /users/me)');
    const unauthRes = await fetch(`${BASE_URL}/users/me`, {
      method: 'GET'
    });
    const unauthJson: any = await unauthRes.json();
    if (unauthRes.status === 401) {
      console.log(`   └─ ✅ Success (401 Unauthorized returned as expected). Code: ${unauthJson.error.code}`);
    } else {
      throw new Error(`   └─ ❌ Failed! Expected 401 Unauthorized, got: ${unauthRes.status}`);
    }

    // ----------------------------------------------------
    // Scenario 6: Update Profile
    // ----------------------------------------------------
    console.log('\n🔄 Test 6: Update Profile Details (PATCH /users/me)');
    const updatedEmail = `updated-${testEmail}`;
    const updateRes = await fetch(`${BASE_URL}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ email: updatedEmail })
    });
    const updateJson: any = await updateRes.json();
    if (updateRes.status === 200 && updateJson.success) {
      console.log(`   └─ ✅ Success (200 OK). New email saved: ${updateJson.data.email}`);
    } else {
      throw new Error(`   └─ ❌ Failed! Status: ${updateRes.status}. Error: ${JSON.stringify(updateJson)}`);
    }

    // ----------------------------------------------------
    // Scenario 7: GDPR Data Export
    // ----------------------------------------------------
    console.log('\n🔄 Test 7: GDPR Data Export (GET /users/me/export)');
    const expRes = await fetch(`${BASE_URL}/users/me/export`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const expJson: any = await expRes.json();
    if (expRes.status === 200 && expJson.success) {
      console.log(`   └─ ✅ Success (200 OK). Exported Data Email: ${expJson.data.user.email}`);
    } else {
      throw new Error(`   └─ ❌ Failed! Status: ${expRes.status}. Error: ${JSON.stringify(expJson)}`);
    }

    // ----------------------------------------------------
    // Scenario 8: Token Rotation (Refresh)
    // ----------------------------------------------------
    console.log('\n🔄 Test 8: Rotate Session Tokens (POST /auth/refresh)');
    const refRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Cookie': refreshTokenCookie }
    });
    const refJson: any = await refRes.json();
    if (refRes.status === 200 && refJson.success) {
      const newAccessToken = refJson.data.accessToken;
      const newCookies = refRes.headers.get('set-cookie');
      if (newAccessToken && newCookies && newCookies.includes('refreshToken')) {
        console.log(`   └─ ✅ Success (200 OK). New tokens rotated cleanly.`);
      } else {
        throw new Error('   └─ ❌ Failed! Valid rotation occurred but tokens were missing.');
      }
    } else {
      throw new Error(`   └─ ❌ Failed! Status: ${refRes.status}. Error: ${JSON.stringify(refJson)}`);
    }

    // ----------------------------------------------------
    // Scenario 9: Token Reuse Breach Detection
    // ----------------------------------------------------
    console.log('\n🔄 Test 9: Submit Reused/Stale Refresh Token (POST /auth/refresh)');
    const reuseRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Cookie': refreshTokenCookie } // Stale cookie
    });
    const reuseJson: any = await reuseRes.json();
    if (reuseRes.status === 401) {
      console.log(`   └─ ✅ Success (401 Unauthorized). Breach detected, token revoked.`);
    } else {
      throw new Error(`   └─ ❌ Failed! Expected 401 Unauthorized for reused refresh token, got: ${reuseRes.status}`);
    }

    // ----------------------------------------------------
    // Scenario 10: GDPR Delete Account
    // ----------------------------------------------------
    console.log('\n🔄 Test 10: Permanent GDPR Delete Account (DELETE /users/me)');
    const delRes = await fetch(`${BASE_URL}/users/me`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ confirmText: 'DELETE MY ACCOUNT' })
    });
    const delJson: any = await delRes.json();
    if (delRes.status === 200 && delJson.success) {
      console.log(`   └─ ✅ Success (200 OK). Server returned success.`);
    } else {
      throw new Error(`   └─ ❌ Failed! Status: ${delRes.status}. Error: ${JSON.stringify(delJson)}`);
    }

    // Verify DB entry deletion
    const finalCheck = await User.findOne({ email: updatedEmail });
    if (!finalCheck) {
      console.log(`   └─ 🌐 DB Validation: User successfully deleted from MongoDB (Verified!).`);
    } else {
      throw new Error('   └─ ❌ DB Validation: User STILL exists in MongoDB!');
    }

    console.log('\n==================================================');
    console.log('🎉 ALL INTEGRATION E2E TEST SCENARIOS PASSED!');
    console.log('==================================================\n');

  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

async function main() {
  let serverProc: any;
  try {
    serverProc = await startServer();
    await runTests();
  } catch (error) {
    console.error('💥 Test run failed:', error);
    process.exitCode = 1;
  } finally {
    if (serverProc) {
      console.log('🛑 Shutting down backend dev server in 2 seconds to allow logs to flush...');
      await wait(2000);
      serverProc.kill('SIGINT');
    }
  }
}

main();
