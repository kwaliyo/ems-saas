<?php

namespace App\Http\Controllers;

use App\Models\Assessment;
use App\Models\Course;
use App\Models\Module;
use App\Models\Participant;
use App\Models\Room;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $instructorId = $request->user()->id;

        // Core Counts
        $coursesCount = Course::where('user_id', $instructorId)->count();
        $modulesCount = Module::whereHas('course', function ($q) use ($instructorId) {
            $q->where('user_id', $instructorId);
        })->count();

        $studentsCount = User::where(function ($query) use ($instructorId) {
            $query->whereHas('enrolledCourses', function ($q) use ($instructorId) {
                $q->where('courses.user_id', $instructorId);
            })->orWhere('created_by_user_id', $instructorId);
        })->count();

        $assessmentsCount = Assessment::where('user_id', $instructorId)->count();

        // Active Rooms
        $activeRooms = Room::where('user_id', $instructorId)
            ->whereIn('status', ['waiting', 'active', 'paused'])
            ->withCount('participants')
            ->latest()
            ->get();

        // Recent Completed Rooms / Examinations
        $recentCompletedRooms = Room::where('user_id', $instructorId)
            ->where('status', 'completed')
            ->withCount('participants')
            ->latest()
            ->limit(5)
            ->get();

        // Performance Statistics
        $totalExamAttempts = Participant::whereHas('room', function ($q) use ($instructorId) {
            $q->where('user_id', $instructorId);
        })->count();

        $allCompletedParticipants = Participant::whereHas('room', function ($q) use ($instructorId) {
            $q->where('user_id', $instructorId);
        })->whereNotNull('completed_at')->get();

        $averageScorePercent = 0;
        $passCount = 0;

        if ($allCompletedParticipants->count() > 0) {
            $totalPercentages = 0;
            foreach ($allCompletedParticipants as $p) {
                $maxScore = $p->total_questions > 0 ? $p->total_questions : 1;
                $pct = min(100, round(($p->score / $maxScore) * 100));
                $totalPercentages += $pct;
                if ($pct >= 50) {
                    $passCount++;
                }
            }
            $averageScorePercent = round($totalPercentages / $allCompletedParticipants->count(), 1);
        }

        $passRatePercent = $allCompletedParticipants->count() > 0
            ? round(($passCount / $allCompletedParticipants->count()) * 100, 1)
            : 0;

        // Recent Student Roster Additions
        $recentStudents = User::where(function ($query) use ($instructorId) {
            $query->whereHas('enrolledCourses', function ($q) use ($instructorId) {
                $q->where('courses.user_id', $instructorId);
            })->orWhere('created_by_user_id', $instructorId);
        })
            ->latest()
            ->limit(5)
            ->get();

        // Recent Courses
        $recentCourses = Course::where('user_id', $instructorId)
            ->withCount(['modules', 'students'])
            ->latest()
            ->limit(4)
            ->get();

        return Inertia::render('dashboard', [
            'metrics' => [
                'coursesCount' => $coursesCount,
                'modulesCount' => $modulesCount,
                'studentsCount' => $studentsCount,
                'assessmentsCount' => $assessmentsCount,
                'activeRoomsCount' => $activeRooms->count(),
                'totalExamAttempts' => $totalExamAttempts,
                'averageScorePercent' => $averageScorePercent,
                'passRatePercent' => $passRatePercent,
            ],
            'activeRooms' => $activeRooms,
            'recentCompletedRooms' => $recentCompletedRooms,
            'recentStudents' => $recentStudents,
            'recentCourses' => $recentCourses,
        ]);
    }
}
