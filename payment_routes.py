# payment_routes.py - Xendit Payment Integration for PetLink

import os
import json
import sqlite3
from datetime import datetime
from flask import jsonify, request, session, redirect

# ── Load Environment Variables (MUST be before reading XENDIT keys) ──
from dotenv import load_dotenv
load_dotenv()

# ── Initialize Xendit ─────────────────────────────────────────────
try:
    import xendit
    from xendit.apis import InvoiceApi
    
    XENDIT_SECRET_KEY = os.environ.get('XENDIT_SECRET_KEY')
    XENDIT_WEBHOOK_TOKEN = os.environ.get('XENDIT_WEBHOOK_TOKEN')
    
    print(f"🔑 XENDIT_SECRET_KEY loaded: {'YES' if XENDIT_SECRET_KEY else 'NO (None)'}")
    
    # Set API key globally (v7+ syntax)
    xendit.set_api_key(XENDIT_SECRET_KEY)
    
    # Create API client
    xendit_client = xendit.ApiClient()
    
    # Initialize Invoice API
    invoice_api = InvoiceApi(xendit_client)
    
    XENDIT_AVAILABLE = True
    print("✅ Xendit SDK loaded successfully")
except ImportError as e:
    XENDIT_AVAILABLE = False
    xendit_client = None
    invoice_api = None
    print(f"⚠️ Xendit SDK not installed: {e}")
except Exception as e:
    XENDIT_AVAILABLE = False
    xendit_client = None
    invoice_api = None
    print(f"⚠️ Xendit SDK initialization error: {e}")

DB_FILE = "secure_auth.db"


def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def register_payment_routes(app):
    """Register all Xendit payment routes with the Flask app."""

    # ── 1. CREATE INVOICE FOR APPOINTMENT ────────────────────────
    @app.route('/api/payment/create-invoice/<int:appointment_id>', methods=['POST'])
    def create_invoice(appointment_id):
        """Create a Xendit invoice for an appointment."""
        if not XENDIT_AVAILABLE:
            return jsonify({
                'success': False,
                'message': 'Xendit SDK not installed. Contact admin.'
            }), 500

        try:
            # Check if user is logged in
            if not session.get('jwt_token'):
                return jsonify({
                    'success': False,
                    'message': 'Please login first.'
                }), 401

            user_email = session.get('username')
            if not user_email:
                return jsonify({
                    'success': False,
                    'message': 'User session expired. Please login again.'
                }), 401

            # Fetch appointment from DB
            conn = get_db()
            appointment = conn.execute("""
                SELECT a.*, p.name as pet_name, u.fullname as customer_name, u.email as customer_email
                FROM appointments a
                JOIN pets p ON a.pet_id = p.id
                JOIN users u ON a.customer_email = u.email
                WHERE a.id = ? AND a.customer_email = ?
            """, (appointment_id, user_email)).fetchone()

            if not appointment:
                conn.close()
                return jsonify({
                    'success': False,
                    'message': 'Appointment not found.'
                }), 404

            # Check if already paid
            if appointment['payment_status'] == 'paid':
                conn.close()
                return jsonify({
                    'success': False,
                    'message': 'This appointment is already paid.'
                })

            # Compute total price from services
            try:
                services = json.loads(appointment['services'])
            except (ValueError, TypeError):
                services = []

            total_price = 0
            if services:
                placeholders = ','.join(['?' for _ in services])
                service_details = conn.execute(
                    f"SELECT name, price FROM services WHERE name IN ({placeholders}) AND is_active = 1",
                    services
                ).fetchall()
                total_price = sum(s['price'] for s in service_details)

            if total_price <= 0:
                conn.close()
                return jsonify({
                    'success': False,
                    'message': 'Invalid total amount.'
                })

            # Build URLs
            base_url = request.host_url.rstrip('/')
            success_url = f"{base_url}/payment/success?appointment_id={appointment_id}"
            failure_url = f"{base_url}/payment/failed?appointment_id={appointment_id}"

            # Unique external_id
            external_id = f"PETLINK-APT-{appointment_id}-{int(datetime.now().timestamp())}"

            # ── CALL XENDIT API (v7+ syntax) ─────────────────────
            # Build the invoice request as a dictionary
            invoice_request = {
                'external_id': external_id,
                'amount': int(total_price),
                'payer_email': appointment['customer_email'],
                'description': f"PetLink Appointment #{appointment_id} - {appointment['pet_name']}",
                'success_redirect_url': success_url,
                'failure_redirect_url': failure_url,
                'currency': 'PHP',
                'invoice_duration': 86400,
                
                # ═══════════════════════════════════════════════════════════
                # ✅ GCASH AT MAYA LANG ANG PAYMENT METHODS
                # ═══════════════════════════════════════════════════════════
                'payment_methods': [
                    'GCASH',      # GCash
                    'PAYMAYA',    # Maya
                ],
            }
            
            # Call create_invoice method
            invoice = invoice_api.create_invoice(invoice_request)

            # Handle response (could be object or dict depending on SDK version)
            if isinstance(invoice, dict):
                invoice_url = invoice.get('invoice_url')
            else:
                # Try attribute access first, then dict access
                invoice_url = getattr(invoice, 'invoice_url', None)
                if not invoice_url and hasattr(invoice, '__getitem__'):
                    invoice_url = invoice['invoice_url']

            # ── Save payment info to DB ───────────────────────────
            # ⚠️ IMPORTANT: HUWAG baguhin ang payment_status dito!
            # Ang payment_status ay dapat ma-update LANG via webhook
            # kapag successful na yung payment (PAID/SETTLED status).
            # Kaya iwanan natin as 'unpaid' siya hanggang mag-webhook.
            conn.execute("""
                UPDATE appointments
                SET payment_reference = ?, payment_url = ?, updated_at = ?
                WHERE id = ?
            """, (
                external_id,
                invoice_url,
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                appointment_id
            ))
            conn.commit()
            conn.close()

            return jsonify({
                'success': True,
                'invoice_url': invoice_url,
                'external_id': external_id,
                'amount': total_price
            })

        except Exception as e:
            print(f"❌ Error creating invoice: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'success': False,
                'message': f'Error creating payment: {str(e)}'
            }), 500

    # ── 2. XENDIT WEBHOOK (Callback) ──────────────────────────────
    @app.route('/api/payment/webhook', methods=['GET', 'POST'])
    def xendit_webhook():
        """Handle Xendit webhook notifications."""
        
        # ✅ Handle GET request (for Xendit "Test and save" verification)
        if request.method == 'GET':
            print("✅ Webhook verification GET request received from Xendit")
            return jsonify({
                'success': True,
                'message': 'Webhook endpoint is active.'
            }), 200
        
        # ── POST handler (actual webhook) ────────────────────────
        try:
            callback_token = request.headers.get('x-callback-token')
            if XENDIT_WEBHOOK_TOKEN and callback_token != XENDIT_WEBHOOK_TOKEN:
                print("❌ Invalid webhook token")
                return jsonify({'success': False, 'message': 'Invalid token'}), 403

            data = request.get_json()
            print(f"📩 Xendit webhook received: {data}")

            external_id = data.get('external_id')
            status = data.get('status')
            payment_method = data.get('payment_method')

            if not external_id:
                return jsonify({'success': False, 'message': 'Missing external_id'}), 400

            conn = get_db()
            appointment = conn.execute(
                "SELECT id FROM appointments WHERE payment_reference = ?",
                (external_id,)
            ).fetchone()

            if not appointment:
                conn.close()
                print(f"⚠️ No appointment found for external_id: {external_id}")
                return jsonify({'success': True, 'message': 'Appointment not found (ignored)'})

            appointment_id = appointment['id']
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            if status in ('PAID', 'SETTLED'):
                conn.execute("""
                    UPDATE appointments
                    SET payment_status = 'paid',
                        payment_method = ?,
                        paid_at = ?,
                        status = 'confirmed',
                        updated_at = ?
                    WHERE id = ?
                """, (payment_method, now, now, appointment_id))
                print(f"✅ Appointment #{appointment_id} marked as PAID")

            elif status in ('EXPIRED', 'FAILED'):
                conn.execute("""
                    UPDATE appointments
                    SET payment_status = 'failed',
                        updated_at = ?
                    WHERE id = ?
                """, (now, appointment_id))
                print(f"❌ Appointment #{appointment_id} payment FAILED/EXPIRED")

            conn.commit()
            conn.close()

            return jsonify({'success': True})

        except Exception as e:
            print(f"❌ Webhook error: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'message': str(e)}), 500

    # ── 3. SUCCESS PAGE (May Appointment Details at Receipt) ──────
    @app.route('/payment/success')
    def payment_success_page():
        appointment_id = request.args.get('appointment_id', '')
        
        # ── Fetch appointment details from database ──────────────
        appointment_data = None
        services_data = []
        total_price = 0
        total_duration = 0
        
        if appointment_id:
            try:
                conn = get_db()
                
                # Get appointment + pet + customer info
                appointment = conn.execute("""
                    SELECT 
                        a.id,
                        a.appointment_date,
                        a.appointment_time,
                        a.services,
                        a.notes,
                        a.status,
                        a.payment_status,
                        a.payment_method,
                        a.paid_at,
                        a.payment_reference,
                        p.name as pet_name,
                        p.pet_type,
                        p.breed,
                        u.fullname as customer_name,
                        u.email as customer_email,
                        u.phone as customer_phone
                    FROM appointments a
                    JOIN pets p ON a.pet_id = p.id
                    JOIN users u ON a.customer_email = u.email
                    WHERE a.id = ?
                """, (appointment_id,)).fetchone()
                
                if appointment:
                    appointment_data = dict(appointment)
                    
                    # Parse services
                    try:
                        services = json.loads(appointment['services'])
                    except (ValueError, TypeError):
                        services = []
                    
                    # Get service details
                    if services:
                        placeholders = ','.join(['?' for _ in services])
                        service_rows = conn.execute(
                            f"SELECT name, price, duration FROM services WHERE name IN ({placeholders}) AND is_active = 1",
                            services
                        ).fetchall()
                        
                        for s in service_rows:
                            services_data.append({
                                'name': s['name'],
                                'price': s['price'],
                                'duration': s['duration']
                            })
                            total_price += s['price']
                            total_duration += s['duration']
                
                conn.close()
            except Exception as e:
                print(f"⚠️ Error fetching appointment details: {e}")
        
        # ── Format data for display ──────────────────────────────
        def format_time_12hr_local(time_str):
            if not time_str:
                return 'N/A'
            try:
                parts = str(time_str).split(':')
                hour = int(parts[0])
                minute = parts[1] if len(parts) > 1 else '00'
                ampm = 'AM' if hour < 12 else 'PM'
                if hour == 0:
                    hour_12 = 12
                elif hour > 12:
                    hour_12 = hour - 12
                else:
                    hour_12 = hour
                return f"{hour_12}:{minute} {ampm}"
            except:
                return str(time_str)
        
        def format_date_local(date_str):
            if not date_str:
                return 'N/A'
            try:
                from datetime import datetime as dt_local
                d = dt_local.strptime(date_str, "%Y-%m-%d")
                return d.strftime("%B %d, %Y (%A)")
            except:
                return str(date_str)
        
        def format_duration_local(total_minutes):
            if not total_minutes or total_minutes == 0:
                return '0 min'
            hours = total_minutes // 60
            minutes = total_minutes % 60
            if hours == 0:
                return f"{minutes} min"
            elif minutes == 0:
                return f"{hours}h"
            else:
                return f"{hours}h {minutes}min"
        
        # ── Build appointment details HTML ───────────────────────
        if appointment_data:
            pet_name = appointment_data.get('pet_name', 'Your Pet')
            pet_type = appointment_data.get('pet_type', 'Dog')
            breed = appointment_data.get('breed', 'Mixed Breed')
            customer_name = appointment_data.get('customer_name', 'Customer')
            customer_email = appointment_data.get('customer_email', '')
            customer_phone = appointment_data.get('customer_phone', '')
            appointment_date = appointment_data.get('appointment_date', '')
            appointment_time = appointment_data.get('appointment_time', '')
            payment_method = appointment_data.get('payment_method', 'Xendit')
            paid_at = appointment_data.get('paid_at', '')
            payment_ref = appointment_data.get('payment_reference', '')
            
            # Format date/time
            formatted_date = format_date_local(appointment_date)
            formatted_time = format_time_12hr_local(appointment_time)
            formatted_duration = format_duration_local(total_duration)
            
            # Format paid_at
            formatted_paid_at = paid_at if paid_at else 'Just now'
            
            # Build services rows
            services_html = ''
            for s in services_data:
                services_html += f"""
                    <div class="receipt-item">
                        <div class="receipt-item-name">
                            <span class="receipt-dot"></span>
                            {s['name']}
                        </div>
                        <div class="receipt-item-value">
                            <span class="receipt-duration">{s['duration']} min</span>
                            <span class="receipt-price">₱{s['price']:.2f}</span>
                        </div>
                    </div>
                """
            
            # Payment method icon
            pm_lower = str(payment_method).lower() if payment_method else ''
            if 'credit' in pm_lower or 'card' in pm_lower:
                pm_icon = '💳'
                pm_display = 'Credit/Debit Card'
            elif 'gcash' in pm_lower:
                pm_icon = '📱'
                pm_display = 'GCash'
            elif 'maya' in pm_lower or 'paymaya' in pm_lower:
                pm_icon = '📱'
                pm_display = 'Maya'
            elif 'grab' in pm_lower:
                pm_icon = '📱'
                pm_display = 'GrabPay'
            elif 'bank' in pm_lower or 'bdo' in pm_lower or 'bpi' in pm_lower:
                pm_icon = '🏦'
                pm_display = payment_method or 'Online Banking'
            elif '7' in pm_lower or 'retail' in pm_lower or 'outlet' in pm_lower:
                pm_icon = '🏪'
                pm_display = 'Retail Outlet'
            else:
                pm_icon = '💰'
                pm_display = payment_method or 'Xendit'
            
            # Short reference for receipt
            short_ref = payment_ref.split('-')[-1] if payment_ref else 'N/A'
            if len(short_ref) > 10:
                short_ref = short_ref[:10]
            
            details_html = f"""
            <!-- ═══ APPOINTMENT DETAILS CARD ═══ -->
            <div class="details-card">
                <div class="details-header">
                    <div class="details-icon">
                        <i class="fas fa-paw"></i>
                    </div>
                    <div class="details-title">
                        <h2>{pet_name}</h2>
                        <p>{pet_type} • {breed}</p>
                    </div>
                    <div class="details-badge">
                        <i class="fas fa-check-circle"></i> Confirmed
                    </div>
                </div>
                
                <div class="details-grid">
                    <div class="detail-row">
                        <span class="detail-label">
                            <i class="fas fa-calendar-alt"></i> Date
                        </span>
                        <span class="detail-value">{formatted_date}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">
                            <i class="fas fa-clock"></i> Time
                        </span>
                        <span class="detail-value">{formatted_time}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">
                            <i class="fas fa-hourglass-half"></i> Duration
                        </span>
                        <span class="detail-value">{formatted_duration}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">
                            <i class="fas fa-user"></i> Customer
                        </span>
                        <span class="detail-value">{customer_name}</span>
                    </div>
                </div>
            </div>
            
            <!-- ═══ RECEIPT CARD ═══ -->
            <div class="receipt-card">
                <div class="receipt-header">
                    <div class="receipt-logo">
                        <i class="fas fa-receipt"></i>
                    </div>
                    <div class="receipt-title">
                        <h3>Official Receipt</h3>
                        <p>PetLink Canine Distemper Center</p>
                    </div>
                </div>
                
                <div class="receipt-ref">
                    <span class="receipt-ref-label">Receipt No.</span>
                    <span class="receipt-ref-value">#{appointment_id}-{short_ref}</span>
                </div>
                
                <div class="receipt-divider"></div>
                
                <div class="receipt-section-title">
                    <i class="fas fa-scissors"></i> Services
                </div>
                
                <div class="receipt-items">
                    {services_html if services_html else '<div class="receipt-item"><span>No services</span></div>'}
                </div>
                
                <div class="receipt-divider"></div>
                
                <div class="receipt-total">
                    <div class="receipt-total-row">
                        <span>Subtotal</span>
                        <span>₱{total_price:.2f}</span>
                    </div>
                    <div class="receipt-total-row receipt-grand-total">
                        <span>Total Paid</span>
                        <span>₱{total_price:.2f}</span>
                    </div>
                </div>
                
                <div class="receipt-divider"></div>
                
                <div class="receipt-payment-info">
                    <div class="receipt-payment-row">
                        <span class="receipt-payment-label">
                            <i class="fas fa-credit-card"></i> Payment Method
                        </span>
                        <span class="receipt-payment-value">
                            {pm_icon} {pm_display}
                        </span>
                    </div>
                    <div class="receipt-payment-row">
                        <span class="receipt-payment-label">
                            <i class="fas fa-clock"></i> Paid At
                        </span>
                        <span class="receipt-payment-value">{formatted_paid_at}</span>
                    </div>
                    <div class="receipt-payment-row">
                        <span class="receipt-payment-label">
                            <i class="fas fa-hashtag"></i> Reference
                        </span>
                        <span class="receipt-payment-value receipt-ref-small">{payment_ref or 'N/A'}</span>
                    </div>
                </div>
                
                <div class="receipt-footer">
                    <div class="receipt-footer-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="receipt-footer-text">
                        <strong>PAID</strong>
                        <span>Thank you for your payment!</span>
                    </div>
                </div>
            </div>
            
            <!-- ═══ ACTION BUTTONS ═══ -->
            <div class="action-buttons">
                <button onclick="window.print()" class="btn btn-secondary">
                    <i class="fas fa-print"></i> Print Receipt
                </button>
                <a href="/dashboard?from_payment=success" class="btn btn-primary">
                    <i class="fas fa-tachometer-alt"></i> Go to Dashboard
                </a>
            </div>
            """
        else:
            # Fallback kung walang appointment data
            details_html = f"""
            <div class="details-card" style="text-align: center; padding: 30px;">
                <div style="font-size: 48px; color: #7ba05b; margin-bottom: 15px;">
                    <i class="fas fa-receipt"></i>
                </div>
                <h3 style="color: #2d3e1f; margin-bottom: 10px;">Payment Received</h3>
                <p style="color: #4a5a3f; font-size: 14px;">Your payment has been processed successfully.</p>
            </div>
            
            <div class="action-buttons">
                <a href="/dashboard?from_payment=success" class="btn btn-primary">
                    <i class="fas fa-tachometer-alt"></i> Go to Dashboard
                </a>
            </div>
            """
        
        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Successful — PetLink</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
            <style>
                * {{
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Poppins', sans-serif;
                }}
                
                body {{
                    min-height: 100vh;
                    background: linear-gradient(160deg, #eaf3e0 0%, #d4e5c4 40%, #c5d9b4 70%, #eaf3e0 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 30px 20px;
                }}
                
                .container {{
                    width: 100%;
                    max-width: 520px;
                }}
                
                /* ── SUCCESS HEADER ──────────────────────────────── */
                .success-header {{
                    background: #ffffff;
                    border-radius: 24px 24px 0 0;
                    padding: 35px 30px 25px;
                    text-align: center;
                    border: 2px solid #10b981;
                    border-bottom: none;
                }}
                
                .success-icon {{
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 72px;
                    height: 72px;
                    border-radius: 20px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: #ffffff;
                    font-size: 36px;
                    margin-bottom: 15px;
                    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
                }}
                
                .success-header h1 {{
                    color: #10b981;
                    font-size: 26px;
                    font-weight: 700;
                    margin-bottom: 6px;
                }}
                
                .success-header p {{
                    color: #4a5a3f;
                    font-size: 14px;
                    line-height: 1.5;
                }}
                
                .success-header p strong {{
                    color: #10b981;
                }}
                
                .verifying-status {{
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 12px;
                    font-size: 12px;
                    color: #94a387;
                }}
                
                .verifying-status .spinner {{
                    width: 14px;
                    height: 14px;
                    border: 2px solid #d4e5c4;
                    border-top-color: #7ba05b;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }}
                
                @keyframes spin {{
                    to {{ transform: rotate(360deg); }}
                }}
                
                /* ── DETAILS CARD ─────────────────────────────────── */
                .details-card {{
                    background: #ffffff;
                    padding: 22px 25px;
                    border-left: 2px solid #10b981;
                    border-right: 2px solid #10b981;
                }}
                
                .details-header {{
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid #eaf3e0;
                    margin-bottom: 16px;
                }}
                
                .details-icon {{
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, rgba(123, 160, 91, 0.15), rgba(90, 122, 63, 0.15));
                    color: #7ba05b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 22px;
                    flex-shrink: 0;
                }}
                
                .details-title {{
                    flex: 1;
                    min-width: 0;
                }}
                
                .details-title h2 {{
                    color: #2d3e1f;
                    font-size: 18px;
                    font-weight: 600;
                    margin: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }}
                
                .details-title p {{
                    color: #94a387;
                    font-size: 12px;
                    margin: 2px 0 0;
                }}
                
                .details-badge {{
                    background: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                    font-size: 11px;
                    font-weight: 700;
                    padding: 5px 12px;
                    border-radius: 12px;
                    white-space: nowrap;
                    flex-shrink: 0;
                }}
                
                .details-badge i {{
                    margin-right: 4px;
                }}
                
                .details-grid {{
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }}
                
                .detail-row {{
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                }}
                
                .detail-label {{
                    color: #94a387;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-shrink: 0;
                }}
                
                .detail-label i {{
                    color: #7ba05b;
                    width: 16px;
                    text-align: center;
                }}
                
                .detail-value {{
                    color: #2d3e1f;
                    font-size: 13px;
                    font-weight: 500;
                    text-align: right;
                    word-break: break-word;
                }}
                
                /* ── RECEIPT CARD ─────────────────────────────────── */
                .receipt-card {{
                    background: #ffffff;
                    padding: 25px 25px;
                    border-left: 2px solid #10b981;
                    border-right: 2px solid #10b981;
                    border-bottom: 2px solid #10b981;
                    border-radius: 0 0 24px 24px;
                }}
                
                .receipt-header {{
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 18px;
                }}
                
                .receipt-logo {{
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #7ba05b, #5a7a3f);
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    flex-shrink: 0;
                }}
                
                .receipt-title h3 {{
                    color: #2d3e1f;
                    font-size: 15px;
                    font-weight: 700;
                    margin: 0;
                }}
                
                .receipt-title p {{
                    color: #94a387;
                    font-size: 11px;
                    margin: 2px 0 0;
                }}
                
                .receipt-ref {{
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f7fbf3;
                    padding: 10px 14px;
                    border-radius: 10px;
                    margin-bottom: 15px;
                }}
                
                .receipt-ref-label {{
                    color: #94a387;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-weight: 600;
                }}
                
                .receipt-ref-value {{
                    color: #5a7a3f;
                    font-size: 12px;
                    font-weight: 700;
                    font-family: monospace;
                }}
                
                .receipt-divider {{
                    height: 1px;
                    background: #eaf3e0;
                    margin: 15px 0;
                    border-top: 1px dashed #d4e5c4;
                }}
                
                .receipt-section-title {{
                    color: #5a7a3f;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }}
                
                .receipt-section-title i {{
                    color: #7ba05b;
                }}
                
                .receipt-items {{
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }}
                
                .receipt-item {{
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                }}
                
                .receipt-item-name {{
                    color: #2d3e1f;
                    font-size: 13px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex: 1;
                    min-width: 0;
                }}
                
                .receipt-dot {{
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #7ba05b;
                    flex-shrink: 0;
                }}
                
                .receipt-item-value {{
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-shrink: 0;
                }}
                
                .receipt-duration {{
                    color: #94a387;
                    font-size: 11px;
                }}
                
                .receipt-price {{
                    color: #5a7a3f;
                    font-size: 13px;
                    font-weight: 600;
                    min-width: 60px;
                    text-align: right;
                }}
                
                .receipt-total {{
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }}
                
                .receipt-total-row {{
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: #4a5a3f;
                    font-size: 13px;
                }}
                
                .receipt-grand-total {{
                    color: #2d3e1f;
                    font-size: 16px;
                    font-weight: 700;
                    padding-top: 6px;
                    border-top: 1px solid #eaf3e0;
                }}
                
                .receipt-grand-total span:last-child {{
                    color: #10b981;
                }}
                
                .receipt-payment-info {{
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }}
                
                .receipt-payment-row {{
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                }}
                
                .receipt-payment-label {{
                    color: #94a387;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }}
                
                .receipt-payment-label i {{
                    color: #7ba05b;
                    width: 14px;
                    text-align: center;
                }}
                
                .receipt-payment-value {{
                    color: #2d3e1f;
                    font-size: 12px;
                    font-weight: 500;
                    text-align: right;
                    word-break: break-word;
                }}
                
                .receipt-ref-small {{
                    font-family: monospace;
                    font-size: 10px;
                    max-width: 200px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }}
                
                .receipt-footer {{
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(123, 160, 91, 0.08));
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    border-radius: 12px;
                    padding: 12px 16px;
                    margin-top: 15px;
                }}
                
                .receipt-footer-icon {{
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: #10b981;
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    flex-shrink: 0;
                }}
                
                .receipt-footer-text {{
                    display: flex;
                    flex-direction: column;
                }}
                
                .receipt-footer-text strong {{
                    color: #10b981;
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                }}
                
                .receipt-footer-text span {{
                    color: #4a5a3f;
                    font-size: 11px;
                }}
                
                /* ── ACTION BUTTONS ───────────────────────────────── */
                .action-buttons {{
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                }}
                
                .btn {{
                    flex: 1;
                    padding: 14px 20px;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.3s ease;
                    font-family: 'Poppins', sans-serif;
                    border: none;
                }}
                
                .btn-primary {{
                    background: linear-gradient(135deg, #7ba05b, #5a7a3f);
                    color: #ffffff;
                    box-shadow: 0 4px 15px rgba(123, 160, 91, 0.3);
                }}
                
                .btn-primary:hover {{
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(123, 160, 91, 0.4);
                }}
                
                .btn-secondary {{
                    background: #ffffff;
                    color: #5a7a3f;
                    border: 2px solid #d4e5c4;
                }}
                
                .btn-secondary:hover {{
                    border-color: #7ba05b;
                    background: #f7fbf3;
                    transform: translateY(-2px);
                }}
                
                /* ── PRINT STYLES ─────────────────────────────────── */
                @media print {{
                    body {{
                        background: #ffffff;
                        padding: 0;
                    }}
                    
                    .action-buttons,
                    .verifying-status {{
                        display: none !important;
                    }}
                    
                    .success-header,
                    .details-card,
                    .receipt-card {{
                        border: 1px solid #d4e5c4;
                        box-shadow: none;
                    }}
                    
                    .success-header {{
                        border-radius: 24px 24px 0 0;
                        border-bottom: none;
                    }}
                    
                    .receipt-card {{
                        border-radius: 0 0 24px 24px;
                    }}
                }}
                
                /* ── MOBILE ───────────────────────────────────────── */
                @media (max-width: 480px) {{
                    .details-header {{
                        flex-wrap: wrap;
                    }}
                    
                    .details-badge {{
                        width: 100%;
                        text-align: center;
                        margin-top: 6px;
                    }}
                    
                    .action-buttons {{
                        flex-direction: column;
                    }}
                    
                    .receipt-ref-small {{
                        max-width: 140px;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <!-- ═══ SUCCESS HEADER ═══ -->
                <div class="success-header">
                    <div class="success-icon">
                        <i class="fas fa-check"></i>
                    </div>
                    <h1>Payment Successful!</h1>
                    <p>Thank you! Your payment has been received.<br>Your appointment is now <strong>confirmed</strong>.</p>
                    <div class="verifying-status" id="verifyingStatus">
                        <div class="spinner"></div>
                        <span>Verifying payment...</span>
                    </div>
                </div>
                
                {details_html}
            </div>
            
            <script>
                // ── Auto-verify payment status from Xendit ─────────
                (async function verifyPayment() {{
                    const appointmentId = "{appointment_id}";
                    const statusEl = document.getElementById('verifyingStatus');
                    
                    if (!appointmentId) {{
                        if (statusEl) statusEl.style.display = 'none';
                        return;
                    }}
                    
                    try {{
                        const res = await fetch(`/api/payment/verify/${{appointmentId}}`, {{
                            method: 'POST',
                            headers: {{ 'Content-Type': 'application/json' }}
                        }});
                        const data = await res.json();
                        
                        console.log('Payment verification result:', data);
                        
                        if (statusEl) {{
                            if (data.success && data.payment_status === 'paid') {{
                                statusEl.innerHTML = '<i class="fas fa-check-circle" style="color: #10b981;"></i> <span style="color: #10b981; font-weight: 600;">Payment verified!</span>';
                            }} else {{
                                statusEl.innerHTML = '<i class="fas fa-clock" style="color: #f59e0b;"></i> <span style="color: #f59e0b;">Processing...</span>';
                            }}
                        }}
                    }} catch (err) {{
                        console.error('Verification error:', err);
                        if (statusEl) statusEl.style.display = 'none';
                    }}
                }})();
            </script>
        </body>
        </html>
        """

    # ── 4. FAILED PAGE ────────────────────────────────────────────
    @app.route('/payment/failed')
    def payment_failed_page():
        appointment_id = request.args.get('appointment_id', '')
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Payment Failed — PetLink</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
                * {{ margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; }}
                body {{
                    min-height: 100vh;
                    background: linear-gradient(160deg, #eaf3e0 0%, #d4e5c4 40%, #c5d9b4 70%, #eaf3e0 100%);
                    display: flex; align-items: center; justify-content: center; padding: 20px;
                }}
                .card {{
                    background: #ffffff; border-radius: 24px; padding: 50px; max-width: 500px;
                    text-align: center; border: 2px solid #ef4444;
                    box-shadow: 0 20px 50px rgba(239, 68, 68, 0.2);
                }}
                .icon {{ font-size: 80px; margin-bottom: 20px; }}
                h1 {{ color: #ef4444; font-size: 32px; margin-bottom: 10px; }}
                p {{ color: #4a5a3f; font-size: 16px; margin-bottom: 25px; line-height: 1.6; }}
                .btn {{
                    display: inline-block; padding: 14px 32px; margin: 5px;
                    background: linear-gradient(135deg, #7ba05b, #5a7a3f);
                    color: #fff; border-radius: 12px; font-weight: 600;
                    text-decoration: none; transition: 0.3s;
                }}
                .btn:hover {{ transform: translateY(-3px); box-shadow: 0 8px 25px rgba(123, 160, 91, 0.4); }}
            </style>
        </head>
        <body>
            <div class="card">
                <div class="icon">❌</div>
                <h1>Payment Failed</h1>
                <p>We were unable to process your payment. Please try again or contact our support team.</p>
                <a href="/dashboard?from_payment=success" class="btn">Go to Dashboard</a>
            </div>
        </body>
        </html>
        """

    # ── 5. CHECK PAYMENT STATUS ──────────────────────────────────
    @app.route('/api/payment/status/<int:appointment_id>', methods=['GET'])
    def check_payment_status(appointment_id):
        """Check the payment status of an appointment."""
        conn = get_db()
        appointment = conn.execute("""
            SELECT payment_status, payment_reference, payment_url, payment_method, paid_at, status
            FROM appointments WHERE id = ?
        """, (appointment_id,)).fetchone()
        conn.close()

        if not appointment:
            return jsonify({'success': False, 'message': 'Appointment not found.'}), 404

        return jsonify({
            'success': True,
            'payment_status': appointment['payment_status'] or 'unpaid',
            'payment_reference': appointment['payment_reference'],
            'payment_url': appointment['payment_url'],
            'payment_method': appointment['payment_method'],
            'paid_at': appointment['paid_at'],
            'appointment_status': appointment['status']
        })

    # ── 6. VERIFY PAYMENT DIRECTLY FROM XENDIT ────────────────────
    @app.route('/api/payment/verify/<int:appointment_id>', methods=['POST'])
    def verify_payment(appointment_id):
        """Manually check payment status from Xendit API.
        Ito ang fallback kapag hindi naka-setup ang webhook."""
        if not XENDIT_AVAILABLE:
            return jsonify({'success': False, 'message': 'Xendit not available'}), 500
        
        try:
            conn = get_db()
            appointment = conn.execute(
                "SELECT payment_reference, payment_status FROM appointments WHERE id = ?",
                (appointment_id,)
            ).fetchone()
            
            if not appointment:
                conn.close()
                return jsonify({'success': False, 'message': 'Appointment not found'}), 404
            
            # Kung paid na, ok na — walang gagawin
            if appointment['payment_status'] == 'paid':
                conn.close()
                return jsonify({'success': True, 'payment_status': 'paid', 'message': 'Already paid'})
            
            external_id = appointment['payment_reference']
            if not external_id:
                conn.close()
                return jsonify({'success': False, 'message': 'No payment reference'}), 400
            
            # ── Fetch invoice from Xendit ─────────────────────────
            print(f"🔍 Verifying payment for external_id: {external_id}")
            
            try:
                invoices = invoice_api.get_invoices(external_id=external_id)
            except Exception as api_err:
                print(f"❌ Xendit API error: {api_err}")
                conn.close()
                return jsonify({'success': False, 'message': f'Xendit API error: {str(api_err)}'}), 500
            
            # Handle response (dict or object)
            if isinstance(invoices, dict):
                invoice_list = invoices.get('data', [])
            else:
                invoice_list = invoices
            
            if not invoice_list:
                conn.close()
                print(f"⚠️ No invoice found for {external_id}")
                return jsonify({'success': False, 'message': 'Invoice not found in Xendit'}), 404
            
            invoice = invoice_list[0]
            
            # Extract status (handle dict or object)
            if isinstance(invoice, dict):
                invoice_status = invoice.get('status')
                payment_method = invoice.get('payment_method')
            else:
                invoice_status = getattr(invoice, 'status', None)
                payment_method = getattr(invoice, 'payment_method', None)
            
            print(f"🔍 Xendit invoice status: {invoice_status}")
            
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            if invoice_status in ('PAID', 'SETTLED'):
                conn.execute("""
                    UPDATE appointments
                    SET payment_status = 'paid',
                        payment_method = ?,
                        paid_at = ?,
                        status = 'confirmed',
                        updated_at = ?
                    WHERE id = ?
                """, (payment_method, now, now, appointment_id))
                conn.commit()
                conn.close()
                print(f"✅ Appointment #{appointment_id} marked as PAID (via verify)")
                return jsonify({'success': True, 'payment_status': 'paid'})
            
            elif invoice_status in ('EXPIRED', 'FAILED'):
                conn.execute("""
                    UPDATE appointments
                    SET payment_status = 'failed',
                        updated_at = ?
                    WHERE id = ?
                """, (now, appointment_id))
                conn.commit()
                conn.close()
                return jsonify({'success': True, 'payment_status': 'failed'})
            
            conn.close()
            return jsonify({'success': True, 'payment_status': 'pending'})
            
        except Exception as e:
            print(f"❌ Error verifying payment: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'message': str(e)}), 500

    print("✅ Payment routes registered successfully")
    return app