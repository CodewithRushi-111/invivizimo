import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

const testEmail = `invoice-tester-${Math.floor(Math.random() * 10000)}@example.com`;
const testPassword = 'Password123!';

async function testInvoiceFlow() {
  console.log('🧪 Starting Invoice API Flow Verification...');
  let accessToken = '';

  try {
    // 1. Register User
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    console.log(`👤 Register User status: ${regRes.status}`);

    // 2. Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const loginJson: any = await loginRes.json();
    accessToken = loginJson.data.accessToken;
    console.log(`🔑 Login status: ${loginRes.status}, Token obtained`);

    // 3. Create Invoice with Refrens features and calculations
    console.log('\n📄 Creating test invoice with custom Refrens features...');
    const invoicePayload = {
      invoiceNumber: 'INV-2026-TESTFLOW',
      clientName: 'Test Client Inc.',
      clientEmail: 'billing@testclient.com',
      senderName: 'My Premium Business',
      senderEmail: 'billing@premium.com',
      senderPhone: '+919999999999',
      senderAddress: '123 Business Tower, Delhi',
      clientAddress: '456 Client Plaza, Mumbai',
      clientPhone: '+918888888888',
      taxRate: 18, // 18% GST
      discountRate: 10, // 10% Discount
      shippingCharges: 1500, // 15.00 USD (in cents)
      notes: 'Please pay within 7 days.',
      terms: 'Standard terms apply.',
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      status: 'draft',
      items: [
        {
          description: 'Premium Software License',
          quantity: 2,
          price: 15000, // 150.00 USD each (in cents)
        },
      ],
    };

    const createRes = await fetch(`${BASE_URL}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(invoicePayload),
    });

    const createJson: any = await createRes.json();
    if (createRes.status !== 201) {
      throw new Error(`Failed to create invoice: ${JSON.stringify(createJson)}`);
    }

    const invoice = createJson.data;
    console.log(`✅ Invoice Created! ID: ${invoice._id}`);
    console.log(`   └─ Invoice Number: ${invoice.invoiceNumber}`);
    console.log(`   └─ Subtotal (expected): 30000 cents ($300.00)`);
    console.log(`   └─ Discount (10%): 3000 cents (-$30.00)`);
    console.log(`   └─ Taxable: 27000 cents ($270.00)`);
    console.log(`   └─ Tax (18%): 4860 cents (+$48.60)`);
    console.log(`   └─ Shipping: 1500 cents (+$15.00)`);
    console.log(`   └─ Calculated Total (expected): 33360 cents ($333.60)`);
    console.log(`   └─ Stored Total in DB: ${invoice.totalAmount} cents ($${(invoice.totalAmount / 100).toFixed(2)})`);

    if (invoice.totalAmount !== 33360) {
      throw new Error(`❌ Math validation failed! Expected 33360, got ${invoice.totalAmount}`);
    }
    console.log('✅ Math calculation validated successfully!');

    // 4. Soft Delete Invoice (Move to Trash)
    console.log('\n🗑️ Moving invoice to Trash...');
    const deleteRes = await fetch(`${BASE_URL}/invoices/${invoice._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    console.log(`   └─ Soft Delete status: ${deleteRes.status}`);

    // 5. Verify it's not in active list
    const activeListRes = await fetch(`${BASE_URL}/invoices`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const activeListJson: any = await activeListRes.json();
    const activeCount = activeListJson.data.length;
    console.log(`   └─ Active invoices count: ${activeCount} (Expected: 0)`);
    if (activeCount !== 0) {
      throw new Error(`Invoice still in active list after soft deletion!`);
    }

    // 6. Verify it's in Trash
    console.log('\n📂 Fetching Trash list...');
    const trashRes = await fetch(`${BASE_URL}/invoices/trash`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const trashJson: any = await trashRes.json();
    const trashInvoices = trashJson.data;
    console.log(`   └─ Trash items count: ${trashInvoices.length} (Expected: 1)`);
    if (trashInvoices.length !== 1 || trashInvoices[0]._id !== invoice._id) {
      throw new Error('Invoice not found in trash list!');
    }
    console.log(`   └─ Stored Invoice found in trash!`);

    // 7. Restore Invoice
    console.log('\n♻️ Restoring invoice from Trash...');
    const restoreRes = await fetch(`${BASE_URL}/invoices/trash/${invoice._id}/restore`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const restoreJson: any = await restoreRes.json();
    console.log(`   └─ Restore status: ${restoreRes.status}`);
    if (restoreRes.status !== 200 || restoreJson.data.isDeleted !== false) {
      throw new Error('Restore response invalid!');
    }

    // 8. Verify restored to active list
    const activeList2Res = await fetch(`${BASE_URL}/invoices`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const activeList2Json: any = await activeList2Res.json();
    console.log(`   └─ Active list count after restore: ${activeList2Json.data.length} (Expected: 1)`);
    if (activeList2Json.data.length !== 1) {
      throw new Error('Restored invoice not found in active list!');
    }

    // 9. Move back to trash
    console.log('\n🗑️ Moving invoice back to Trash...');
    await fetch(`${BASE_URL}/invoices/${invoice._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    // 10. Permanently Delete
    console.log('\n💥 Permanently deleting invoice from Trash...');
    const permDeleteRes = await fetch(`${BASE_URL}/invoices/trash/${invoice._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    console.log(`   └─ Permanent Delete status: ${permDeleteRes.status}`);
    if (permDeleteRes.status !== 200) {
      throw new Error('Permanent deletion failed!');
    }

    // 11. Verify completely gone
    const finalTrashRes = await fetch(`${BASE_URL}/invoices/trash`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const finalTrashJson: any = await finalTrashRes.json();
    console.log(`   └─ Final Trash count: ${finalTrashJson.data.length} (Expected: 0)`);
    if (finalTrashJson.data.length !== 0) {
      throw new Error('Invoice still exists in trash after permanent deletion!');
    }

    console.log('\n🎉 ALL INVOICE FLOW VERIFICATIONS PASSED SUCCESSFULLY!');

  } catch (error) {
    console.error('💥 Test execution failed:', error);
  }
}

testInvoiceFlow();
