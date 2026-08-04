<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Participant;
use App\Models\ParticipantAnswer;
use App\Models\Question;
use App\Models\Room;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    public function index(Request $request): Response
    {
        $instructorId = $request->user()->id;

        // 1. Total Completed Exams Count (Optimized count without eager loading nested models)
        $totalCompletedExams = Room::where('user_id', $instructorId)
            ->where('status', 'completed')
            ->count();

        // 2. Fetch tested participants once
        $participants = Participant::whereHas('room', function ($q) use ($instructorId) {
            $q->where('user_id', $instructorId);
        })->whereNotNull('completed_at')->get();

        $totalCandidatesTested = $participants->count();

        // Pass/Fail distribution
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

        $overallAveragePercent = $totalCandidatesTested > 0
            ? round($totalScorePctSum / $totalCandidatesTested, 1)
            : 0;

        $overallPassRate = $totalCandidatesTested > 0
            ? round(($passedCandidates / $totalCandidatesTested) * 100, 1)
            : 0;

        // 3. Course Breakdown Analytics (Optimized withCount for students and modules)
        $courses = Course::where('user_id', $instructorId)
            ->withCount(['students', 'modules'])
            ->get();

        $instructorRooms = Room::where('user_id', $instructorId)
            ->with('assessment.module')
            ->get(['id', 'user_id', 'assessment_id', 'assessment_subject']);

        $participantsByRoom = Participant::whereIn('room_id', $instructorRooms->pluck('id'))
            ->get()
            ->groupBy('room_id');

        $courseAnalytics = [];
        foreach ($courses as $course) {
            $courseRoomIds = $instructorRooms->filter(function ($room) use ($course) {
                $subjectMatch = in_array($room->assessment_subject, [$course->title, $course->code], true);
                $moduleMatch = $room->assessment?->module?->course_id === $course->id;

                return $subjectMatch || $moduleMatch;
            })->pluck('id');

            $cParticipants = $courseRoomIds
                ->flatMap(fn ($roomId) => $participantsByRoom->get($roomId, collect()))
                ->values();
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
                'students_count' => $course->students_count,
                'modules_count' => $course->modules_count,
                'total_exams' => $cParticipants->count(),
                'average_pct' => $cParticipants->count() > 0 ? round($cScoreSum / $cParticipants->count(), 1) : 0,
                'pass_rate_pct' => $cParticipants->count() > 0 ? round(($cPassCount / $cParticipants->count()) * 100, 1) : 0,
            ];
        }

        // 4. Hardest & Most Challenging Questions (Aggregated via SQL to avoid N+1 and memory overhead)
        $questionStatsRaw = ParticipantAnswer::whereHas('participant.room', function ($q) use ($instructorId) {
            $q->where('user_id', $instructorId);
        })
            ->selectRaw('question_id, COUNT(*) as total_answers, SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers')
            ->groupBy('question_id')
            ->get();

        $questions = Question::whereIn('id', $questionStatsRaw->pluck('question_id'))
            ->get()
            ->keyBy('id');

        $itemAnalysis = [];
        foreach ($questionStatsRaw as $qStat) {
            $question = $questions->get($qStat->question_id);
            if (! $question) {
                continue;
            }

            $totalAnswers = (int) $qStat->total_answers;
            $correctAnswers = (int) $qStat->correct_answers;
            $incorrect = $totalAnswers - $correctAnswers;
            $errorRate = $totalAnswers > 0
                ? round(($incorrect / $totalAnswers) * 100, 1)
                : 0;

            $itemAnalysis[] = [
                'id' => $question->id,
                'question_text' => $question->question_text,
                'type' => $question->type,
                'total_attempts' => $totalAnswers,
                'correct_count' => $correctAnswers,
                'error_rate_pct' => $errorRate,
            ];
        }

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
