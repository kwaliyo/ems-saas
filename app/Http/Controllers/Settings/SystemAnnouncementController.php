<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\SystemAnnouncement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SystemAnnouncementController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();

        if (! $user->isSuperAdmin() && $user->role !== 'super_admin') {
            abort(403, 'Only Super Admin can manage system announcements.');
        }

        $announcement = SystemAnnouncement::latest()->first();

        return Inertia::render('settings/announcement', [
            'announcement' => $announcement ? [
                'id' => $announcement->id,
                'enabled' => (bool) $announcement->enabled,
                'announcement_id' => $announcement->announcement_id,
                'message' => $announcement->message,
                'type' => $announcement->type,
                'link_text' => $announcement->link_text,
                'link_url' => $announcement->link_url,
            ] : [
                'enabled' => true,
                'message' => '📢 System Notice: All exam sessions and real-time candidate syncing are operating at 100% capacity.',
                'type' => 'info',
                'link_text' => null,
                'link_url' => null,
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user->isSuperAdmin() && $user->role !== 'super_admin') {
            abort(403, 'Only Super Admin can manage system announcements.');
        }

        $validated = $request->validate([
            'enabled' => 'boolean',
            'message' => 'required|string|max:500',
            'type' => 'required|string|in:info,warning,success,danger',
            'link_text' => 'nullable|string|max:50',
            'link_url' => 'nullable|string|max:255',
        ]);

        $announcement = SystemAnnouncement::latest()->first();

        $data = [
            'enabled' => $request->boolean('enabled'),
            'announcement_id' => 'ann-'.time(),
            'message' => trim($validated['message']),
            'type' => $validated['type'],
            'link_text' => ! empty($validated['link_text']) ? trim($validated['link_text']) : null,
            'link_url' => ! empty($validated['link_url']) ? trim($validated['link_url']) : null,
            'created_by_user_id' => $user->id,
        ];

        if ($announcement) {
            $announcement->update($data);
        } else {
            SystemAnnouncement::create($data);
        }

        return back()->with('success', 'System announcement broadcast updated successfully.');
    }
}
