<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminUserController extends Controller
{
    public function index(Request $request): Response
    {
        $query = User::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('student_number', 'like', "%{$search}%");
            });
        }

        if ($role = $request->input('role')) {
            if ($role === 'super_admin') {
                $query->where('role', 'super_admin');
            } else {
                $query->where(function ($q) {
                    $q->where('role', 'instructor')->orWhereNull('role');
                });
            }
        }

        $users = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/Users', [
            'users' => $users,
            'filters' => [
                'search' => $request->input('search', ''),
                'role' => $request->input('role', ''),
            ],
        ]);
    }

    public function toggleRole(User $user): RedirectResponse
    {
        $newRole = $user->role === 'super_admin' ? 'instructor' : 'super_admin';
        $user->update(['role' => $newRole]);

        return back()->with('flash', [
            'message' => "Updated {$user->name}'s role to {$newRole}.",
            'type' => 'success',
        ]);
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->with('flash', [
                'message' => 'You cannot delete your own account.',
                'type' => 'error',
            ]);
        }

        $user->delete();

        return back()->with('flash', [
            'message' => 'User deleted successfully.',
            'type' => 'success',
        ]);
    }

    public function impersonate(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->with('flash', [
                'message' => 'You are already logged in as this user.',
                'type' => 'error',
            ]);
        }

        session(['impersonator_id' => auth()->id()]);
        auth()->login($user);

        return redirect()->route('dashboard')->with('flash', [
            'message' => "Now impersonating {$user->name}.",
            'type' => 'info',
        ]);
    }

    public function stopImpersonating(): RedirectResponse
    {
        $impersonatorId = session('impersonator_id');

        if ($impersonatorId) {
            $admin = User::find($impersonatorId);
            if ($admin) {
                session()->forget('impersonator_id');
                auth()->login($admin);

                return redirect()->route('admin.dashboard')->with('flash', [
                    'message' => 'Stopped impersonation and returned to Admin Panel.',
                    'type' => 'success',
                ]);
            }
        }

        return redirect()->route('dashboard');
    }
}
