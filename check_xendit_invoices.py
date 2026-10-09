import os
from dotenv import load_dotenv

load_dotenv()

import xendit
from xendit.apis import InvoiceApi

XENDIT_SECRET_KEY = os.environ.get('XENDIT_SECRET_KEY')
xendit.set_api_key(XENDIT_SECRET_KEY)
xendit_client = xendit.ApiClient()
invoice_api = InvoiceApi(xendit_client)

print("=" * 80)
print("📋 XENDIT INVOICES (Last 20)")
print("=" * 80)

# Kunin lahat ng invoices
invoices = invoice_api.get_invoices()

if isinstance(invoices, dict):
    invoice_list = invoices.get('data', [])
else:
    invoice_list = invoices

for inv in invoice_list[:20]:
    if isinstance(inv, dict):
        ext_id = inv.get('external_id')
        status = inv.get('status')
        amount = inv.get('amount')
    else:
        ext_id = getattr(inv, 'external_id', None)
        status = getattr(inv, 'status', None)
        amount = getattr(inv, 'amount', None)
    
    emoji = "✅" if status == "PAID" else ("❌" if status in ["EXPIRED", "FAILED"] else "⏳")
    print(f"\n{emoji} {ext_id}")
    print(f"   Status: {status}")
    print(f"   Amount: ₱{amount}")

print("\n" + "=" * 80)