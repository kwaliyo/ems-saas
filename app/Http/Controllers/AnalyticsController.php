<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Participant;
use App\Models\ParticipantAnswer;
use App\Models\Room;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    public function index(Request $request): Response
    {
        $instructorId = $request->user()->id;

        // Fetch completed rooms for this instructor
        $completedRooms = Room::where('user_id', $instructorId)
            ->where('status', 'completed')
            ->with(['assessment', 'participants.answers'])
            ->latest()
            ->get();

        $totalCompletedExams = $completedRooms->count();
        $totalCandidatesTested = Participant::whereHas('room', function ($q) use ($instructorId) {
            $q->where('user_id', $instructorId);
        })->whereNotNull('completed_at')->count();

        // Pass/Fail distribution
        $participants = Participant::whereHas('room', function ($q) use ($instructorId) {
            $q->where('user_id', $instructorId);
        })->whereNotNull('completed_at')->get();

        $scoreDistribution = [
            '90-100%' => 0,
            '75-89%' => 0,
            '50-74%' => 0,
            'below-50%' => 0,
        ];

        $totalScorePctSum = 0;
        $passedCandidates = 0;

        foreach ($participants as $p) {
            $maxScore = $p->total_questions > 0 ? $p->total_questions : 1;
            $pct = min(100, round(($p->score / $maxScore) * 100));
            $totalScorePctSum += $pct;

            if ($pct >= 90) {
                $scoreDistribution['90-100%']++;
            } elseif ($pct >= 75) {
                $scoreDistribution['75-89%']++;
            } elseif ($pct >= 50) {
                $scoreDistribution['50-74%']++;
            } else {
                $scoreDistribution['below-50%']++;
            }

            if ($pct >= 50) {
                $passedCandidates++;
            }
        }

        $overallAveragePercent = $participants->count() > 0
            ? round($totalScorePctSum / $participants->count(), 1)
            : 0;

        $overallPassRate = $participants->count() > 0
            ? round(($passedCandidates / $participants->count()) * 100, 1)
            : 0;

        // Course Breakdown Analytics
        $courses = Course::where('user_id', $instructorId)
            ->with(['modules.assessments', 'students'])
            ->get();

        $courseAnalytics = [];
        foreach ($courses as $course) {
            $courseRoomIds = Room::where('user_id', $instructorId)
                ->where(function ($query) use ($course) {
                    $query->whereIn('assessment_subject', [$course->title, $course->code])
                        ->orWhereHas('assessment.module', function ($q) use ($course) {
                            $q->where('course_id', $course->id);
                        });
                })
                ->pluck('id');

            $cParticipants = Participant::whereIn('room_id', $courseRoomIds)->get();
            $cScoreSum = 0;
            $cPassCount = 0;
            foreach ($cParticipants as $cp) {
                $max = $cp->total_questions > 0 ? $cp->total_questions : 1;
                $pct = min(100, round(($cp->score / $max) * 100));
                $cScoreSum += $pct;
                if ($pct >= 50) {
                    $cPassCount++;
                }
            }

            $courseAnalytics[] = [
                'id' => $course->id,
                'code' => $course->code,
                'title' => $course->title,
                'students_count' => $course->students->count(),
                'modules_count' => $course->modules->count(),
                'total_exams' => $cParticipants->count(),
                'average_pct' => $cParticipants->count() > 0 ? round($cScoreSum / $cParticipants->count(), 1) : 0,
                'pass_rate_pct' => $cParticipants->count() > 0 ? round(($cPassCount / $cParticipants->count()) * 100, 1) : 0,
            ];
        }

        // Hardest & Most Challenging Questions Analytics
        $answers = ParticipantAnswer::whereHas('participant.room', function ($q) use ($instructorId) {
            $q->where('user_id', $instructorId);
        })->with('question')->get();

        $questionStats = [];
        foreach ($answers as $ans) {
            if (! $ans->question) {
                continue;
            }
            $qId = $ans->question_id;
            if (! isset($questionStats[$qId])) {
                $questionStats[$qId] = [
                    'id' => $qId,
                    'text' => $ans->question->question_text,
                    'type' => $ans->question->type,
                    'total_answers' => 0,
                    'correct_answers' => 0,
                ];
            }
            $questionStats[$qId]['total_answers']++;
            if ($ans->is_correct) {
                $questionStats[$qId]['correct_answers']++;
            }
        }

        $itemAnalysis = [];
        foreach ($questionStats as $qStat) {
            $incorrect = $qStat['total_answers'] - $qStat['correct_answers'];
            $errorRate = $qStat['total_answers'] > 0
                ? round(($incorrect / $qStat['total_answers']) * 100, 1)
                : 0;

            $itemAnalysis[] = [
                'id' => $qStat['id'],
                'question_text' => $qStat['text'],
                'type' => $qStat['type'],
                'total_attempts' => $qStat['total_answers'],
                'correct_count' => $qStat['correct_answers'],
                'error_rate_pct' => $errorRate,
            ];
        }

        // Sort hardest questions first (highest error rate)
        usort($itemAnalysis, fn ($a, $b) => $b['error_rate_pct'] <=> $a['error_rate_pct']);
        $itemAnalysis = array_slice($itemAnalysis, 0, 6);

        return Inertia::render('analytics/Index', [
            'summary' => [
                'totalCompletedExams' => $totalCompletedExams,
                'totalCandidatesTested' => $totalCandidatesTested,
                'overallAveragePercent' => $overallAveragePercent,
                'overallPassRate' => $overallPassRate,
                'scoreDistribution' => $scoreDistribution,
            ],
            'courseAnalytics' => $courseAnalytics,
            'itemAnalysis' => $itemAnalysis,
        ]);
    }
}
