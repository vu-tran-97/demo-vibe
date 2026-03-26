/**
 * Seed 50 Firebase users (25 sellers + 25 buyers) via Firebase REST API
 * then sync to PostgreSQL via backend API.
 *
 * Usage: npx tsx scripts/seed-users.ts
 */

const FIREBASE_API_KEY = 'AIzaSyB6bGyC5pqbou49aqLNuFz4P9OH0eRv9X8';
const API_BASE = 'http://localhost:4000';
const PASSWORD = 'Test@1234';

interface FirebaseSignUpResponse {
  localId: string;
  idToken: string;
  email: string;
  error?: { message: string };
}

async function firebaseSignUp(email: string, password: string): Promise<FirebaseSignUpResponse> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  return res.json();
}

async function firebaseSignIn(email: string, password: string): Promise<FirebaseSignUpResponse> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  return res.json();
}

async function apiCall(path: string, token: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function createUser(
  email: string,
  name: string,
  nickname: string,
  role: 'BUYER' | 'SELLER',
): Promise<{ success: boolean; email: string; role: string; id?: number }> {
  // Try sign up, fallback to sign in if already exists
  let result = await firebaseSignUp(email, PASSWORD);

  if (result.error?.message === 'EMAIL_EXISTS') {
    result = await firebaseSignIn(email, PASSWORD);
  }

  if (!result.idToken) {
    return { success: false, email, role, id: undefined };
  }

  // Trigger auto-create in DB via /api/auth/me
  await apiCall('/api/auth/me', result.idToken);

  // Set profile
  await apiCall('/api/auth/profile', result.idToken, 'PATCH', { name, nickname });

  // Set role
  const roleRes = await apiCall('/api/auth/role', result.idToken, 'PATCH', { role });

  return {
    success: roleRes.success === true,
    email,
    role,
    id: roleRes.data?.id,
  };
}

async function main() {
  console.log('=== Seeding 50 Users (25 Sellers + 25 Buyers) ===\n');

  const sellerNames = [
    'Minh Ceramics', 'Hoa Textiles', 'Linh Art Studio', 'Tuan Jewelry',
    'Mai Home Decor', 'Duc Food Market', 'Lan Pottery', 'Nam Silk Shop',
    'Thu Paintings', 'Hung Gems', 'Phuong Crafts', 'Khanh Organics',
    'Van Sculpture', 'Bao Silver', 'Thanh Woodwork', 'Ngoc Embroidery',
    'Dung Lacquer', 'Hieu Bamboo', 'Trang Glass Art', 'Son Bronze',
    'Yen Candles', 'Long Clay Works', 'Ha Stone Art', 'Khoa Leather',
    'My Incense Shop',
  ];

  const buyerNames = [
    'Anna Kim', 'Brian Lee', 'Cindy Tran', 'David Nguyen', 'Emma Pham',
    'Frank Vo', 'Grace Do', 'Henry Le', 'Iris Hoang', 'Jack Bui',
    'Kate Dang', 'Leo Luong', 'Mia Truong', 'Nick Lam', 'Olivia Ngo',
    'Peter Ha', 'Quinn Vu', 'Rose Dinh', 'Sam Chu', 'Tina Ly',
    'Uma Thai', 'Victor Huynh', 'Wendy Mai', 'Xavier Duong', 'Yuki Phan',
  ];

  const results: Array<{ email: string; role: string; id?: number; success: boolean }> = [];

  // Create sellers (sequential to avoid Firebase rate limiting)
  console.log('--- Creating Sellers ---');
  for (let i = 1; i <= 25; i++) {
    const email = `seller${i}@yopmail.com`;
    const name = sellerNames[i - 1];
    const nickname = `seller${i}`;
    const res = await createUser(email, name, nickname, 'SELLER');
    results.push(res);
    const status = res.success ? 'OK' : 'FAIL';
    console.log(`  [${status}] ${email} → id=${res.id}, role=SELLER`);

    // Small delay to avoid Firebase rate limiting
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log('\n--- Creating Buyers ---');
  for (let i = 1; i <= 25; i++) {
    const email = `buyer${i}@yopmail.com`;
    const name = buyerNames[i - 1];
    const nickname = `buyer${i}`;
    const res = await createUser(email, name, nickname, 'BUYER');
    results.push(res);
    const status = res.success ? 'OK' : 'FAIL';
    console.log(`  [${status}] ${email} → id=${res.id}, role=BUYER`);

    await new Promise((r) => setTimeout(r, 300));
  }

  // Summary
  const ok = results.filter((r) => r.success).length;
  const fail = results.filter((r) => !r.success).length;
  console.log(`\n=== Done: ${ok} success, ${fail} failed ===`);

  // Output seller IDs for crawler
  const sellerIds = results
    .filter((r) => r.role === 'SELLER' && r.id)
    .map((r) => r.id);
  console.log(`\nSeller IDs: [${sellerIds.join(', ')}]`);
}

main().catch(console.error);
