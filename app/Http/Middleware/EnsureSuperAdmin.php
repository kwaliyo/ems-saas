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
        $isImpersonating = session()->has('impersonator_id');

        if (! $user || (! $user->isSuperAdmin() && ! $isImpersonating)) {
            abort(403, 'Unauthorized access to Super Admin Panel.');
        }

        return $next($request);
    }
}
