<?php

namespace App\Http\Controllers;

use App\Models\Assessment;
use App\Models\ParticipantAnswer;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Services\AIAssessmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AssessmentController extends Controller
{
    public function index(Request $request): Response
    {
        $assessments = $request->user()->assessments()
            ->withCount(['questions', 'rooms'])
            ->with(['rooms' => function ($q) {
                $q->whereIn('status', ['waiting', 'active', 'paused'])->latest();
            }])
            ->latest()
            ->get();

        return Inertia::render('assessments/Index', [
            'assessments' => $assessments,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('assessments/Builder', [
            'assessment' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'subject' => 'nullable|string|max:100',
            'grade_level' => 'nullable|string|max:100',
            'settings' => 'nullable|array',
            'questions' => 'required|array|min:1',
            'questions.*.type' => 'required|string|in:multiple_choice,true_false,short_answer,multi_select',
            'questions.*.question_text' => 'required|string',
            'questions.*.explanation' => 'nullable|string',
            'questions.*.points' => 'required|integer|min:1',
            'questions.*.options' => 'required_unless:questions.*.type,short_answer|array',
            'questions.*.options.*.option_text' => 'required|string',
            'questions.*.options.*.is_correct' => 'required|boolean',
        ]);

        DB::transaction(function () use ($request, $validated) {
            $assessment = $request->user()->assessments()->create([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'subject' => $validated['subject'] ?? 'General',
                'grade_level' => $validated['grade_level'] ?? null,
                'settings' => $validated['settings'] ?? [
                    'shuffle_questions' => false,
                    'shuffle_answers' => false,
                    'show_feedback' => true,
                    'require_names' => true,
                    'anti_cheat_mode' => false,
                ],
            ]);

            foreach ($validated['questions'] as $qIndex => $qData) {
                $question = $assessment->questions()->create([
                    'order' => $qIndex,
                    'type' => $qData['type'],
                    'question_text' => $qData['question_text'],
                    'explanation' => $qData['explanation'] ?? null,
                    'points' => $qData['points'] ?? 1,
                ]);

                if (isset($qData['options']) && is_array($qData['options'])) {
                    foreach ($qData['options'] as $oIndex => $oData) {
                        $question->options()->create([
                            'option_text' => $oData['option_text'],
                            'is_correct' => (bool) $oData['is_correct'],
                            'order' => $oIndex,
                        ]);
                    }
                }
            }
        });

        return redirect()->route('assessments.index')->with('success', 'Assessment created successfully.');
    }

    public function edit(Assessment $assessment): Response
    {
        $this->authorizeOwner($assessment);

        $assessment->load(['questions.options']);

        return Inertia::render('assessments/Builder', [
            'assessment' => $assessment,
        ]);
    }

    public function update(Request $request, Assessment $assessment): RedirectResponse
    {
        $this->authorizeOwner($assessment);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'subject' => 'nullable|string|max:100',
            'grade_level' => 'nullable|string|max:100',
            'settings' => 'nullable|array',
            'questions' => 'required|array|min:1',
            'questions.*.type' => 'required|string|in:multiple_choice,true_false,short_answer,multi_select',
            'questions.*.question_text' => 'required|string',
            'questions.*.explanation' => 'nullable|string',
            'questions.*.points' => 'required|integer|min:1',
            'questions.*.options' => 'required_unless:questions.*.type,short_answer|array',
            'questions.*.options.*.option_text' => 'required|string',
            'questions.*.options.*.is_correct' => 'required|boolean',
        ]);

        DB::transaction(function () use ($assessment, $validated) {
            $assessment->update([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'subject' => $validated['subject'] ?? 'General',
                'grade_level' => $validated['grade_level'] ?? null,
                'settings' => $validated['settings'] ?? $assessment->settings,
            ]);

            // Replace questions
            $assessment->questions()->delete();

            foreach ($validated['questions'] as $qIndex => $qData) {
                $question = $assessment->questions()->create([
                    'order' => $qIndex,
                    'type' => $qData['type'],
                    'question_text' => $qData['question_text'],
                    'explanation' => $qData['explanation'] ?? null,
                    'points' => $qData['points'] ?? 1,
                ]);

                if (isset($qData['options']) && is_array($qData['options'])) {
                    foreach ($qData['options'] as $oIndex => $oData) {
                        $question->options()->create([
                            'option_text' => $oData['option_text'],
                            'is_correct' => (bool) $oData['is_correct'],
                            'order' => $oIndex,
                        ]);
                    }
                }
            }
        });

        return redirect()->route('assessments.index')->with('success', 'Assessment updated successfully.');
    }

    public function destroy(Assessment $assessment): RedirectResponse
    {
        $this->authorizeOwner($assessment);

        DB::transaction(function () use ($assessment) {
            // Set assessment_id to null on rooms so reports persist permanently
            $assessment->rooms()->update(['assessment_id' => null]);

            // Set question_id to null on participant_answers before unlinking questions
            $questionIds = $assessment->questions()->pluck('id');
            ParticipantAnswer::whereIn('question_id', $questionIds)->update(['question_id' => null]);

            // Unlink questions from assessment (assessment_id = null) so they remain in module question bank
            $assessment->questions()->update(['assessment_id' => null]);

            $assessment->delete();
        });

        return redirect()->route('assessments.index')->with('success', 'Assessment deleted. Module questions & reports preserved.');
    }

    public function duplicate(Assessment $assessment): RedirectResponse
    {
        $this->authorizeOwner($assessment);

        DB::transaction(function () use ($assessment) {
            $newAssessment = $assessment->replicate();
            $newAssessment->title = $assessment->title . ' (Copy)';
            $newAssessment->save();

            foreach ($assessment->questions()->with('options')->get() as $q) {
                $newQuestion = $q->replicate();
                $newQuestion->assessment_id = $newAssessment->id;
                $newQuestion->save();

                foreach ($q->options as $opt) {
                    $newOpt = $opt->replicate();
                    $newOpt->question_id = $newQuestion->id;
                    $newOpt->save();
                }
            }
        });

        return redirect()->route('assessments.index')->with('success', 'Assessment duplicated.');
    }

    public function generateAi(Request $request, AIAssessmentService $aiService)
    {
        $request->validate([
            'topic' => 'required|string|max:255',
            'question_count' => 'nullable|integer|min:1|max:20',
            'grade_level' => 'nullable|string',
        ]);

        $count = $request->input('question_count', 5);
        $grade = $request->input('grade_level', 'High School');
        $topic = $request->input('topic');

        $quizData = $aiService->generateQuiz($topic, $count, $grade);

        return response()->json($quizData);
    }

    private function authorizeOwner(Assessment $assessment): void
    {
        if ($assessment->user_id !== auth()->id()) {
            abort(403, 'Unauthorized access to assessment.');
        }
    }
}
