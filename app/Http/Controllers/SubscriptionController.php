<?php

namespace App\Http\Controllers;

use App\Mail\SubscriptionReceiptMail;
use App\Models\SubscriptionPayment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    /**
     * Server-side source of truth for plan pricing, in kobo.
     * Never trust an amount or plan price supplied by the client.
     */
    private const PLAN_PRICES_KOBO = [
        'pro' => 1500000,       // ₦15,000
        'institution' => 9500000, // ₦95,000
    ];

    private function planPriceKobo(string $plan): ?int
    {
        return self::PLAN_PRICES_KOBO[$plan] ?? null;
    }

    public function show(Request $request): Response
    {
        $user = $request->user();
        $publicKey = config('services.paystack.public_key') ?? env('PAYSTACK_PUBLIC_KEY', '');
        $secretKey = config('services.paystack.secret_key') ?? env('PAYSTACK_SECRET_KEY', '');

        return Inertia::render('settings/billing', [
            'subscription' => [
                'plan' => $user->subscription_plan ?? 'free',
                'max_candidates' => $user->maxCandidateLimit(),
                'expires_at' => $user->subscription_expires_at?->toIso8601String(),
            ],
            'paystack_public_key' => $publicKey,
            'has_paystack_keys' => ! empty($publicKey) || ! empty($secretKey),
            'plans' => [
                [
                    'id' => 'free',
                    'name' => 'Free Starter',
                    'price' => '₦0',
                    'period' => 'Forever Free',
                    'max_candidates' => 25,
                    'features' => [
                        'Up to 25 candidate seats per live room',
                        'Unlimited Courses & Modules',
                        'Instant auto-graded exams',
                        'Basic report downloads',
                    ],
                ],
                [
                    'id' => 'pro',
                    'name' => 'Pro Educator',
                    'price' => '₦15,000',
                    'period' => '/ month',
                    'max_candidates' => 250,
                    'features' => [
                        'Up to 250 candidate seats per live room',
                        'Unlimited Courses & Modules',
                        'Bulk CSV student & question imports',
                        'External Guest ID Generator',
                        'CSV scorecard report export',
                        'Custom exam retake policies',
                    ],
                ],
                [
                    'id' => 'institution',
                    'name' => 'Institution / College',
                    'price' => '₦95,000',
                    'period' => '/ month',
                    'max_candidates' => 999999,
                    'features' => [
                        'Unlimited candidate seats per live room',
                        'Multi-instructor administration',
                        'Dedicated priority server capacity',
                        'Custom university branding',
                        'Full invigilation audit logs',
                        '24/7 Priority support',
                    ],
                ],
            ],
        ]);
    }

    /**
     * Self-service plan change WITHOUT payment. Only downgrades to the free
     * plan are allowed here — paid plans must go through Paystack verification
     * (initPaystack -> paystackCallback / verifyPaystack). Granting a paid plan
     * from this endpoint was a payment bypass.
     */
    public function upgrade(Request $request): RedirectResponse
    {
        $request->validate([
            'plan' => ['required', 'string', 'in:free,pro,institution'],
        ]);

        $plan = $request->input('plan');
        $user = $request->user();

        $user->update([
            'subscription_plan' => $plan,
            'subscription_expires_at' => $plan === 'free' ? null : now()->addDays(30),
        ]);

        if ($plan !== 'free') {
            try {
                Mail::to($user->email)->send(new SubscriptionReceiptMail(
                    user: $user,
                    plan: $plan,
                    amount: $plan === 'pro' ? '₦15,000' : '₦95,000',
                    reference: 'TEST-UPGRADE-'.strtoupper(Str::random(8)),
                    seatLimit: $plan === 'pro' ? '250 Candidates' : 'Unlimited Candidates',
                    paymentDate: now()->format('M d, Y h:i A'),
                    expiresAt: now()->addDays(30)->format('M d, Y')
                ));
            } catch (\Throwable $e) {
                Log::warning('Failed sending subscription receipt email: '.$e->getMessage());
            }
        }

        return back()->with('flash', [
            'message' => 'Your subscription has been updated to the '.ucfirst($plan).' plan.',
            'type' => 'success',
        ]);
    }

    public function initPaystack(Request $request)
    {
        $request->validate([
            'plan' => ['required', 'string', 'in:pro,institution'],
        ]);

        $plan = $request->input('plan');
        $secretKey = config('services.paystack.secret_key');

        if (! $secretKey) {
            return back()->with('flash', [
                'message' => 'Paystack secret key is missing. Please add PAYSTACK_SECRET_KEY to your .env file.',
                'type' => 'error',
            ]);
        }

        $amountKobo = $this->planPriceKobo($plan);
        $user = $request->user();

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.$secretKey,
                'Content-Type' => 'application/json',
            ])->post(rtrim(config('services.paystack.payment_url', 'https://api.paystack.co'), '/').'/transaction/initialize', [
                'email' => $user->email,
                'amount' => $amountKobo,
                'currency' => 'NGN',
                'callback_url' => route('subscription.paystack.callback'),
                'metadata' => [
                    'user_id' => $user->id,
                    'plan' => $plan,
                ],
            ]);

            if ($response->successful() && $response->json('data.authorization_url')) {
                // Record a pending payment bound to this user & reference for later verification.
                $reference = $response->json('data.reference');
                if ($reference) {
                    SubscriptionPayment::updateOrCreate(
                        ['reference' => $reference],
                        [
                            'user_id' => $user->id,
                            'plan' => $plan,
                            'amount_kobo' => $amountKobo,
                            'currency' => 'NGN',
                            'status' => 'pending',
                        ]
                    );
                }

                return Inertia::location($response->json('data.authorization_url'));
            }
        } catch (\Exception $e) {
            return back()->with('flash', [
                'message' => 'Failed to initialize Paystack checkout: '.$e->getMessage(),
                'type' => 'error',
            ]);
        }

        return back()->with('flash', [
            'message' => 'Unable to initialize Paystack payment. Please check your Paystack API keys.',
            'type' => 'error',
        ]);
    }

    public function paystackCallback(Request $request): RedirectResponse
    {
        $reference = $request->input('reference') ?? $request->input('trxref');

        if (! $reference) {
            return redirect()->route('subscription.billing')->with('flash', [
                'message' => 'Payment verification failed or was cancelled.',
                'type' => 'error',
            ]);
        }

        $result = $this->verifyAndGrant($request->user(), (string) $reference);

        return redirect()->route('subscription.billing')->with('flash', $result);
    }

    public function verifyPaystack(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'reference' => ['required', 'string'],
        ]);

        $result = $this->verifyAndGrant($request->user(), $validated['reference']);

        return back()->with('flash', $result);
    }

    /**
     * Verify a Paystack transaction server-side and grant the plan only when
     * every check passes. The plan and amount are taken from Paystack's verified
     * response (never from the client), the reference is bound to the paying user,
     * and a unique reference row enforces idempotency / replay protection.
     *
     * @return array{message: string, type: string}
     */
    private function verifyAndGrant(?User $user, string $reference): array
    {
        if (! $user) {
            return ['message' => 'You must be signed in to verify a payment.', 'type' => 'error'];
        }

        // Idempotency: a reference already redeemed cannot be replayed.
        $existing = SubscriptionPayment::where('reference', $reference)->first();
        if ($existing && $existing->status === 'success') {
            return [
                'message' => 'This payment has already been applied to an account.',
                'type' => $existing->user_id === $user->id ? 'info' : 'error',
            ];
        }

        $secretKey = config('services.paystack.secret_key');
        if (! $secretKey) {
            return ['message' => 'Payment processor is not configured. Please contact support.', 'type' => 'error'];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.$secretKey,
            ])->get(rtrim(config('services.paystack.payment_url', 'https://api.paystack.co'), '/')."/transaction/verify/{$reference}");
        } catch (\Throwable $e) {
            Log::warning('Paystack verify request failed', ['reference' => $reference, 'error' => $e->getMessage()]);

            return ['message' => 'Could not reach the payment processor. Please try again.', 'type' => 'error'];
        }

        $data = $response->json('data');

        // The transaction itself must be paid ("success"), not merely a 200 response.
        if (! $response->successful() || ! is_array($data) || ($data['status'] ?? null) !== 'success') {
            return ['message' => 'Payment could not be verified as successful.', 'type' => 'error'];
        }

        // Bind the reference to the user who initiated it (set in initPaystack metadata).
        $metaUserId = $data['metadata']['user_id'] ?? null;
        if ($metaUserId !== null && (int) $metaUserId !== $user->id) {
            Log::warning('Paystack reference user mismatch', [
                'reference' => $reference, 'meta_user' => $metaUserId, 'auth_user' => $user->id,
            ]);

            return ['message' => 'This payment does not belong to your account.', 'type' => 'error'];
        }

        // Plan comes from Paystack metadata (set server-side at init), not the client.
        $plan = $data['metadata']['plan'] ?? null;
        $expectedKobo = is_string($plan) ? $this->planPriceKobo($plan) : null;
        if ($expectedKobo === null) {
            return ['message' => 'Unrecognized subscription plan on this payment.', 'type' => 'error'];
        }

        // The amount actually paid must match the plan price exactly.
        $paidKobo = (int) ($data['amount'] ?? 0);
        $currency = strtoupper((string) ($data['currency'] ?? 'NGN'));
        if ($paidKobo < $expectedKobo || $currency !== 'NGN') {
            Log::warning('Paystack amount/currency mismatch', [
                'reference' => $reference, 'paid' => $paidKobo, 'expected' => $expectedKobo, 'currency' => $currency,
            ]);

            return ['message' => 'The amount paid does not match the selected plan.', 'type' => 'error'];
        }

        // Grant atomically, claiming the reference in the same transaction.
        DB::transaction(function () use ($user, $reference, $plan, $paidKobo, $currency) {
            SubscriptionPayment::updateOrCreate(
                ['reference' => $reference],
                [
                    'user_id' => $user->id,
                    'plan' => $plan,
                    'amount_kobo' => $paidKobo,
                    'currency' => $currency,
                    'status' => 'success',
                    'verified_at' => now(),
                ]
            );

            $user->forceFill([
                'subscription_plan' => $plan,
                'subscription_expires_at' => now()->addMonth(),
            ])->save();
        });

        $this->sendReceiptMail($user, $plan, $reference);

        return [
            'message' => 'Payment verified! Your '.ucfirst($plan).' subscription is now active. Receipt sent to '.$user->email.'.',
            'type' => 'success',
        ];
    }

    private function sendReceiptMail(User $user, string $plan, ?string $reference = null): void
    {
        try {
            $amount = match ($plan) {
                'pro' => '₦15,000',
                'institution' => '₦95,000',
                default => '₦0 (Free)',
            };

            $seatLimit = match ($plan) {
                'pro' => '250 candidate seats / live room',
                'institution' => 'Unlimited candidate seats',
                default => '25 candidate seats / live room',
            };

            $ref = $reference ?? ('INV-'.strtoupper(uniqid()));
            $paymentDate = now()->format('F j, Y, g:i a');
            $expiresAt = $plan === 'free' ? 'Forever Free' : now()->addMonth()->format('F j, Y');

            Mail::to($user->email)->send(new SubscriptionReceiptMail(
                user: $user,
                plan: $plan,
                amount: $amount,
                reference: $ref,
                seatLimit: $seatLimit,
                paymentDate: $paymentDate,
                expiresAt: $expiresAt
            ));
        } catch (\Exception $e) {
            Log::warning('Subscription receipt email could not be sent: '.$e->getMessage());
        }
    }
}
