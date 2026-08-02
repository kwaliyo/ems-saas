<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminSubscriptionController extends Controller
{
    public function index(Request $request): Response
    {
        $freeCount = User::where(function ($q) {
            $q->where('subscription_plan', 'free')->orWhereNull('subscription_plan');
        })->count();

        $proCount = User::where('subscription_plan', 'pro')->count();
        $institutionCount = User::where('subscription_plan', 'institution')->count();

        // Calculate Estimated MRR in NGN (Pro = ₦15,000, Institution = ₦95,000)
        $estimatedMrr = ($proCount * 15000) + ($institutionCount * 95000);

        $query = User::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($plan = $request->input('plan')) {
            if ($plan === 'free') {
                $query->where(function ($q) {
                    $q->where('subscription_plan', 'free')->orWhereNull('subscription_plan');
                });
            } else {
                $query->where('subscription_plan', $plan);
            }
        }

        $subscribers = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/Subscriptions', [
            'metrics' => [
                'estimated_mrr' => $estimatedMrr,
                'free_count' => $freeCount,
                'pro_count' => $proCount,
                'institution_count' => $institutionCount,
                'total_subscribers' => $freeCount + $proCount + $institutionCount,
            ],
            'subscribers' => $subscribers,
            'filters' => [
                'search' => $request->input('search', ''),
                'plan' => $request->input('plan', ''),
            ],
        ]);
    }

    public function updatePlan(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'plan' => ['required', 'string', 'in:free,pro,institution'],
        ]);

        $user->update([
            'subscription_plan' => $request->input('plan'),
            'subscription_expires_at' => $request->input('plan') === 'free' ? null : now()->addMonth(),
        ]);

        return back()->with('flash', [
            'message' => "Updated {$user->name}'s subscription plan to ".ucfirst($user->subscription_plan).'.',
            'type' => 'success',
        ]);
    }
}
