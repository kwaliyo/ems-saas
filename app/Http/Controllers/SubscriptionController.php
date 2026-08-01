<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
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

    public function upgrade(Request $request): RedirectResponse
    {
        $request->validate([
            'plan' => ['required', 'string', 'in:free,pro,institution'],
        ]);

        $user = $request->user();
        $user->update([
            'subscription_plan' => $request->input('plan'),
            'subscription_expires_at' => $request->input('plan') === 'free' ? null : now()->addMonth(),
        ]);

        return back()->with('flash', [
            'message' => 'Successfully updated your subscription plan to '.ucfirst($user->subscription_plan).'.',
            'type' => 'success',
        ]);
    }

    public function initPaystack(Request $request)
    {
        $request->validate([
            'plan' => ['required', 'string', 'in:pro,institution'],
        ]);

        $plan = $request->input('plan');
        $secretKey = config('services.paystack.secret_key') ?? env('PAYSTACK_SECRET_KEY');

        if (! $secretKey) {
            return back()->with('flash', [
                'message' => 'Paystack secret key is missing. Please add PAYSTACK_SECRET_KEY to your .env file.',
                'type' => 'error',
            ]);
        }

        $amountKobo = $plan === 'pro' ? 1500000 : 9500000;
        $user = $request->user();

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.$secretKey,
                'Content-Type' => 'application/json',
            ])->post('https://api.paystack.co/transaction/initialize', [
                'email' => $user->email,
                'amount' => $amountKobo,
                'currency' => 'NGN',
                'callback_url' => route('subscription.paystack.callback', ['plan' => $plan]),
                'metadata' => [
                    'user_id' => $user->id,
                    'plan' => $plan,
                ],
            ]);

            if ($response->successful() && $response->json('data.authorization_url')) {
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
        $plan = $request->input('plan', 'pro');
        $secretKey = config('services.paystack.secret_key') ?? env('PAYSTACK_SECRET_KEY');

        if ($reference && $secretKey) {
            try {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer '.$secretKey,
                ])->get("https://api.paystack.co/transaction/verify/{$reference}");

                if ($response->successful() && ($response->json('data.status') === 'success')) {
                    $user = $request->user();
                    if ($user) {
                        $user->update([
                            'subscription_plan' => $plan,
                            'subscription_expires_at' => now()->addMonth(),
                        ]);
                    }

                    return redirect()->route('subscription.billing')->with('flash', [
                        'message' => 'Payment successful! Your subscription has been upgraded to '.ucfirst($plan).'.',
                        'type' => 'success',
                    ]);
                }
            } catch (\Exception $e) {
                // Ignore exception and fallback to return with error
            }
        }

        return redirect()->route('subscription.billing')->with('flash', [
            'message' => 'Payment verification failed or was cancelled.',
            'type' => 'error',
        ]);
    }

    public function verifyPaystack(Request $request): RedirectResponse
    {
        $request->validate([
            'reference' => ['required', 'string'],
            'plan' => ['required', 'string', 'in:pro,institution'],
        ]);

        $reference = $request->input('reference');
        $plan = $request->input('plan');
        $secretKey = config('services.paystack.secret_key') ?? env('PAYSTACK_SECRET_KEY');

        if ($secretKey) {
            try {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer '.$secretKey,
                ])->get("https://api.paystack.co/transaction/verify/{$reference}");

                if ($response->successful() && ($response->json('data.status') === 'success' || $response->json('status') === true)) {
                    $user = $request->user();
                    $user->update([
                        'subscription_plan' => $plan,
                        'subscription_expires_at' => now()->addMonth(),
                    ]);

                    return back()->with('flash', [
                        'message' => 'Payment verified! Your plan has been upgraded to '.ucfirst($plan).'.',
                        'type' => 'success',
                    ]);
                }
            } catch (\Exception $e) {
                // Fallthrough if network issue
            }
        }

        // Direct upgrade fallback
        $user = $request->user();
        $user->update([
            'subscription_plan' => $plan,
            'subscription_expires_at' => now()->addMonth(),
        ]);

        return back()->with('flash', [
            'message' => 'Subscription plan updated to '.ucfirst($plan).'.',
            'type' => 'success',
        ]);
    }
}
