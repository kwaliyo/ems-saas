<?php

namespace App\Http\Controllers;

use App\Models\Participant;
use App\Models\Room;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $rooms = Room::where('user_id', $request->user()->id)
            ->with(['assessment'])
            ->withCount(['participants'])
            ->latest()
            ->get();

        return Inertia::render('reports/Index', [
            'rooms' => $rooms,
        ]);
    }

    public function show(Room $room): Response
    {
        $this->authorizeOwner($room);

        $room->load([
            'assessment.questions.options',
            'participants.answers',
        ]);
        $room->ensureQuestionsLoaded();

        return Inertia::render('reports/Show', [
            'room' => $room,
        ]);
    }

    public function showScript(Room $room, Participant $participant): Response
    {
        $this->authorizeOwner($room);

        // Ensure the participant actually belongs to this room (prevents IDOR
        // where a valid participant id from another room could be viewed).
        if ($participant->room_id !== $room->id) {
            abort(404);
        }

        $room->load(['assessment.questions.options']);
        $participant->load(['answers']);
        $room->ensureQuestionsLoaded();

        return Inertia::render('reports/StudentScript', [
            'room' => $room,
            'participant' => $participant,
        ]);
    }

    public function exportCsv(Room $room): StreamedResponse
    {
        $this->authorizeOwner($room);

        $room->load(['assessment.questions', 'participants.answers']);
        $room->ensureQuestionsLoaded();

        $questions = $room->assessment->questions;
        $participants = $room->participants;

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="assessment_report_'.$room->code.'.csv"',
        ];

        $callback = function () use ($questions, $participants) {
            $file = fopen('php://output', 'w');

            // Header row
            $headerRow = ['Student Name', 'Student ID', 'Score', 'Total Questions', 'Percentage', 'Completed At'];
            foreach ($questions as $qIndex => $q) {
                $headerRow[] = 'Q'.($qIndex + 1).' Score';
            }
            fputcsv($file, $headerRow);

            foreach ($participants as $p) {
                $pct = $p->total_questions > 0 ? round(($p->score / $p->total_questions) * 100, 1).'%' : '0%';
                $row = [
                    $p->name,
                    $p->student_id_code ?? 'N/A',
                    $p->score,
                    $p->total_questions,
                    $pct,
                    $p->completed_at ? $p->completed_at->toDateTimeString() : 'Incomplete',
                ];

                $answersMap = $p->answers->keyBy('question_id');
                foreach ($questions as $q) {
                    $ans = $answersMap->get($q->id);
                    $row[] = $ans ? ($ans->is_correct ? 'Correct ('.$ans->score_awarded.')' : 'Incorrect (0)') : 'Unanswered';
                }

                fputcsv($file, $row);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function destroy(Room $room): RedirectResponse
    {
        $this->authorizeOwner($room);
        $room->delete();

        return redirect()->route('reports.index')->with('success', 'Assessment report deleted.');
    }

    private function authorizeOwner(Room $room): void
    {
        $user = auth()->user();

        if ($room->user_id !== $user?->id && ! $user?->isSuperAdmin()) {
            abort(403, 'Unauthorized access to this report.');
        }
    }
}
