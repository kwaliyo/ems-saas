<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Access to the Super Admin panel requires an actual super-admin account.
        // Previously a session `impersonator_id` flag alone satisfied this gate,
        // which let an impersonated (non-admin) user retain full admin access.
        if (! $user || ! $user->isSuperAdmin()) {
            abort(403, 'Unauthorized access to Super Admin Panel.');
        }

        return $next($request);
    }
}
