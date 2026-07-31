<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Module;
use App\Models\Participant;
use App\Models\Room;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $totalInstructors = User::where('role', 'instructor')->orWhereNull('role')->count();
        $totalSuperAdmins = User::where('role', 'super_admin')->count();
        $totalCourses = Course::count();
        $totalModules = Module::count();

        $activeRoomsCount = Room::whereIn('status', ['waiting', 'active', 'paused'])->count();
        $completedRoomsCount = Room::where('status', 'completed')->count();
        $totalCandidateSessions = Participant::count();

        // Calculate average platform pass rate across completed participant sessions
        $completedParticipants = Participant::whereNotNull('completed_at')->get();
        $passedCount = 0;
        $totalScorePctSum = 0;

        foreach ($completedParticipants as $p) {
            $max = $p->total_questions > 0 ? $p->total_questions : 1;
            $pct = min(100, round(($p->score / $max) * 100));
            $totalScorePctSum += $pct;
            if ($pct >= 50) {
                $passedCount++;
            }
        }

        $platformPassRate = $completedParticipants->count() > 0
            ? round(($passedCount / $completedParticipants->count()) * 100, 1)
            : 0;

        $platformAverageScore = $completedParticipants->count() > 0
            ? round($totalScorePctSum / $completedParticipants->count(), 1)
            : 0;

        // Active Live Rooms Monitor Feed
        $activeRooms = Room::with('user:id,name,email')
            ->whereIn('status', ['waiting', 'active', 'paused'])
            ->withCount('participants')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($room) {
                return [
                    'id' => $room->id,
                    'code' => $room->code,
                    'title' => $room->assessment_title ?? 'Archived Assessment',
                    'subject' => $room->assessment_subject ?? 'General',
                    'status' => $room->status,
                    'mode' => $room->mode,
                    'instructor_name' => $room->user?->name ?? 'Unknown Instructor',
                    'instructor_email' => $room->user?->email ?? '',
                    'participants_count' => $room->participants_count,
                    'created_at' => $room->created_at->toIso8601String(),
                ];
            });

        // Recent Registered Instructors
        $recentUsers = User::orderBy('created_at', 'desc')
            ->take(6)
            ->get(['id', 'name', 'email', 'role', 'created_at']);

        return Inertia::render('admin/Dashboard', [
            'metrics' => [
                'total_instructors' => $totalInstructors,
                'total_super_admins' => $totalSuperAdmins,
                'total_courses' => $totalCourses,
                'total_modules' => $totalModules,
                'active_rooms_count' => $activeRoomsCount,
                'completed_rooms_count' => $completedRoomsCount,
                'total_candidate_sessions' => $totalCandidateSessions,
                'platform_pass_rate' => $platformPassRate,
                'platform_average_score' => $platformAverageScore,
            ],
            'activeRooms' => $activeRooms,
            'recentUsers' => $recentUsers,
        ]);
    }
}
