<?php

namespace App\Http\Controllers;

use App\Models\Assessment;
use App\Models\Module;
use App\Models\Question;
use App\Models\Room;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RoomController extends Controller
{
    public function launch(Request $request, Assessment $assessment): RedirectResponse
    {
        if ($assessment->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'mode' => 'required|string|in:student_paced,teacher_paced,space_race,exit_ticket,time_based',
            'duration_minutes' => 'nullable|integer|min:1',
            'shuffle_questions' => 'boolean',
            'shuffle_answers' => 'boolean',
            'show_feedback' => 'boolean',
        ]);

        $durationMinutes = $validated['duration_minutes']
            ?? $assessment->module->exam_duration_minutes
            ?? 60;

        $room = Room::create([
            'user_id' => $request->user()->id,
            'assessment_id' => $assessment->id,
            'assessment_title' => $assessment->title,
            'assessment_subject' => $assessment->subject,
            'code' => Room::generateUniqueCode(),
            'mode' => $validated['mode'],
            'status' => 'active',
            'current_question_index' => 0,
            'settings' => [
                'duration_minutes' => (int) $durationMinutes,
                'shuffle_questions' => $validated['shuffle_questions'] ?? false,
                'shuffle_answers' => $validated['shuffle_answers'] ?? false,
                'show_feedback' => $validated['show_feedback'] ?? true,
            ],
            'questions_snapshot' => $assessment->questions()->with('options')->get()->toArray(),
            'started_at' => now(),
        ]);

        return redirect()->route('rooms.dashboard', $room->id);
    }

    public function launchModule(Request $request, Module $module): RedirectResponse
    {
        if ($module->course->user_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'mode' => 'required|string|in:student_paced,teacher_paced,space_race,exit_ticket,time_based',
            'duration_minutes' => 'nullable|integer|min:1',
            'shuffle_questions' => 'boolean',
            'shuffle_answers' => 'boolean',
            'show_feedback' => 'boolean',
        ]);

        // Create an assessment container ONLY upon launching live room!
        $assessment = $module->assessments()->latest()->first();

        if (! $assessment) {
            $assessment = $request->user()->assessments()->create([
                'module_id' => $module->id,
                'title' => ($module->code ? "[{$module->code}] " : '') . $module->title . ' Exam',
                'description' => $module->description,
                'subject' => $module->course->title,
                'settings' => [
                    'show_feedback' => $module->allow_review,
                    'shuffle_questions' => false,
                ],
            ]);
        }

        // Link all module question bank items to this assessment container
        Question::where('module_id', $module->id)
            ->whereNull('assessment_id')
            ->update(['assessment_id' => $assessment->id]);

        $durationMinutes = $validated['duration_minutes']
            ?? $module->exam_duration_minutes
            ?? 60;

        $room = Room::create([
            'user_id' => $request->user()->id,
            'assessment_id' => $assessment->id,
            'assessment_title' => $assessment->title,
            'assessment_subject' => $assessment->subject,
            'code' => Room::generateUniqueCode(),
            'mode' => $validated['mode'],
            'status' => 'active',
            'current_question_index' => 0,
            'settings' => [
                'duration_minutes' => (int) $durationMinutes,
                'shuffle_questions' => $validated['shuffle_questions'] ?? false,
                'shuffle_answers' => $validated['shuffle_answers'] ?? false,
                'show_feedback' => $validated['show_feedback'] ?? false,
                'allow_retake' => (bool) $module->allow_retake,
                'allow_review' => (bool) $module->allow_review,
                'hide_score' => (bool) $module->hide_score,
            ],
            'questions_snapshot' => $module->questions()->with('options')->get()->toArray(),
            'started_at' => now(),
        ]);

        return redirect()->route('rooms.dashboard', $room->id);
    }

    public function liveDashboard(Room $room): Response
    {
        $this->authorizeOwner($room);

        $room->load([
            'assessment.questions.options',
            'participants.answers',
        ]);

        return Inertia::render('rooms/LiveDashboard', [
            'room' => $room,
        ]);
    }

    public function liveData(Room $room)
    {
        $this->authorizeOwner($room);

        $room->load(['participants.answers']);

        return response()->json([
            'room' => $room,
            'participants' => $room->participants,
        ]);
    }

    public function nextQuestion(Room $room): RedirectResponse
    {
        $this->authorizeOwner($room);

        $maxIndex = $room->assessment->questions()->count() - 1;
        if ($room->current_question_index < $maxIndex) {
            $room->increment('current_question_index');
        }

        return back();
    }

    public function prevQuestion(Room $room): RedirectResponse
    {
        $this->authorizeOwner($room);

        if ($room->current_question_index > 0) {
            $room->decrement('current_question_index');
        }

        return back();
    }

    public function pause(Room $room): RedirectResponse
    {
        $this->authorizeOwner($room);

        $room->update(['status' => 'paused']);

        return back();
    }

    public function resume(Room $room): RedirectResponse
    {
        $this->authorizeOwner($room);

        $room->update(['status' => 'active']);

        return back();
    }

    public function toggleLock(Room $room): RedirectResponse
    {
        $this->authorizeOwner($room);

        $newStatus = $room->status === 'active' ? 'paused' : 'active';
        $room->update(['status' => $newStatus]);

        return back();
    }

    public function end(Room $room): RedirectResponse
    {
        $this->authorizeOwner($room);

        $room->update(['status' => 'completed']);

        // Auto-terminate / complete all active candidate sessions in this room
        $room->participants()
            ->whereNull('completed_at')
            ->update(['completed_at' => now()]);

        return redirect()->route('reports.show', $room->id);
    }

    private function authorizeOwner(Room $room): void
    {
        if ($room->user_id !== auth()->id()) {
            abort(403);
        }
    }
}
