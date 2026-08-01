<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('settings/billing', [
            'subscription' => [
                'plan' => $user->subscription_plan ?? 'free',
                'max_candidates' => $user->maxCandidateLimit(),
                'expires_at' => $user->subscription_expires_at?->toIso8601String(),
            ],
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
}
