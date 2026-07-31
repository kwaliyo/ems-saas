<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Participant;
use App\Models\Room;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminRoomController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Room::with('user:id,name,email')->withCount('participants');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('assessment_title', 'like', "%{$search}%")
                    ->orWhere('assessment_subject', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $rooms = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/Rooms', [
            'rooms' => $rooms,
            'filters' => [
                'search' => $request->input('search', ''),
                'status' => $request->input('status', ''),
            ],
        ]);
    }

    public function endRoom(Room $room): RedirectResponse
    {
        $room->update([
            'status' => 'completed',
            'ended_at' => now(),
        ]);

        Participant::where('room_id', $room->id)
            ->whereNull('completed_at')
            ->update(['completed_at' => now()]);

        return back()->with('flash', [
            'message' => "Room {$room->code} terminated successfully.",
            'type' => 'success',
        ]);
    }
}
