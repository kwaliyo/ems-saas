<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Receipt - K-EMS</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f6f8;
            color: #1e293b;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .header {
            background-color: #064e3b;
            color: #ffffff;
            padding: 30px 24px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
        }
        .header p {
            margin: 6px 0 0 0;
            font-size: 13px;
            color: #a7f3d0;
        }
        .content {
            padding: 32px 24px;
        }
        .greeting {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        .intro {
            font-size: 14px;
            color: #475569;
            line-height: 1.6;
            margin-bottom: 24px;
        }
        .receipt-card {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 24px;
        }
        .receipt-table {
            width: 100%;
            border-collapse: collapse;
        }
        .receipt-table td {
            padding: 10px 0;
            font-size: 14px;
            border-bottom: 1px border #e2e8f0;
        }
        .receipt-table tr:last-child td {
            border-bottom: none;
        }
        .label {
            color: #64748b;
            font-weight: 500;
        }
        .value {
            text-align: right;
            font-weight: 700;
            color: #0f172a;
        }
        .amount-highlight {
            font-size: 18px;
            color: #059669;
            font-weight: 800;
        }
        .badge {
            display: inline-block;
            padding: 4px 10px;
            background-color: #d1fae5;
            color: #065f46;
            font-weight: 800;
            font-size: 12px;
            border-radius: 9999px;
            text-transform: uppercase;
        }
        .footer {
            background-color: #f1f5f9;
            padding: 20px 24px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        .footer a {
            color: #059669;
            text-decoration: none;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>K-EMS SAAS</h1>
            <p>Exam Management System & Telemetry</p>
        </div>

        <div class="content">
            <div class="greeting">Hello {{ $user->name }},</div>
            <div class="intro">
                Thank you for your payment! Your subscription plan has been successfully updated on K-EMS. Here are the details of your official transaction receipt:
            </div>

            <div class="receipt-card">
                <table class="receipt-table">
                    <tr>
                        <td class="label">Transaction Ref:</td>
                        <td class="value">{{ $reference }}</td>
                    </tr>
                    <tr>
                        <td class="label">Plan Purchased:</td>
                        <td class="value"><span class="badge">{{ strtoupper($plan) }} PLAN</span></td>
                    </tr>
                    <tr>
                        <td class="label">Amount Paid:</td>
                        <td class="value amount-highlight">{{ $amount }}</td>
                    </tr>
                    <tr>
                        <td class="label">Candidate Capacity:</td>
                        <td class="value">{{ $seatLimit }}</td>
                    </tr>
                    <tr>
                        <td class="label">Payment Date:</td>
                        <td class="value">{{ $paymentDate }}</td>
                    </tr>
                    <tr>
                        <td class="label">Subscription Expires:</td>
                        <td class="value">{{ $expiresAt }}</td>
                    </tr>
                </table>
            </div>

            <p style="font-size: 13px; color: #64748b; margin: 0;">
                If you have any questions regarding your account or invoice, please reach out to our support team at <a href="mailto:support@kwaliyo.name.ng">support@kwaliyo.name.ng</a>.
            </p>
        </div>

        <div class="footer">
            &copy; {{ date('Y') }} K-EMS Exam Management System. All rights reserved.
        </div>
    </div>
</body>
</html>
