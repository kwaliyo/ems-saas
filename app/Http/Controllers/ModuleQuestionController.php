<?php

namespace App\Http\Controllers;

use App\Models\Assessment;
use App\Models\Course;
use App\Models\Module;
use App\Models\Question;
use App\Models\QuestionOption;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ModuleQuestionController extends Controller
{
    public function index(Request $request, Course $course, Module $module): Response
    {
        $this->authorizeOwner($course, $module);

        $assessment = $module->assessments()->latest()->first();

        if (! $assessment) {
            $questions = Question::where('module_id', $module->id)->with('options')->orderBy('order')->get();

            $assessment = [
                'id' => 0,
                'module_id' => $module->id,
                'title' => ($module->code ? "[{$module->code}] " : '') . $module->title . ' Exam',
                'description' => $module->description,
                'subject' => $course->title,
                'settings' => [
                    'show_feedback' => $module->allow_review,
                    'shuffle_questions' => false,
                ],
                'questions' => $questions,
            ];
        } else {
            // Auto-relink any unlinked questions belonging to this module's question bank
            Question::where('module_id', $module->id)
                ->whereNull('assessment_id')
                ->update(['assessment_id' => $assessment->id]);

            $assessment->load(['questions.options']);
        }

        return Inertia::render('courses/ModuleQuestions', [
            'course' => $course,
            'module' => $module,
            'assessment' => $assessment,
        ]);
    }

    public function storeQuestion(Request $request, Course $course, Module $module): RedirectResponse
    {
        $this->authorizeOwner($course, $module);

        $assessment = $this->getOrCreateAssessment($request, $course, $module);

        $validated = $request->validate([
            'type' => 'required|string|in:multiple_choice,true_false,short_answer,multi_select',
            'question_text' => 'required|string',
            'explanation' => 'nullable|string',
            'points' => 'required|integer|min:1',
            'options' => 'required_unless:type,short_answer|array',
            'options.*.option_text' => 'required|string',
            'options.*.is_correct' => 'required|boolean',
        ]);

        DB::transaction(function () use ($assessment, $module, $validated) {
            $order = $assessment->questions()->count();

            $question = $assessment->questions()->create([
                'module_id' => $module->id,
                'order' => $order,
                'type' => $validated['type'],
                'question_text' => $validated['question_text'],
                'explanation' => $validated['explanation'] ?? null,
                'points' => $validated['points'] ?? 1,
            ]);

            if (isset($validated['options']) && is_array($validated['options'])) {
                foreach ($validated['options'] as $oIndex => $oData) {
                    $question->options()->create([
                        'option_text' => $oData['option_text'],
                        'is_correct' => (bool) $oData['is_correct'],
                        'order' => $oIndex,
                    ]);
                }
            }
        });

        return back()->with('success', 'Question added.');
    }

    public function updateQuestion(Request $request, Course $course, Module $module, Question $question): RedirectResponse
    {
        $this->authorizeOwner($course, $module);

        $validated = $request->validate([
            'type' => 'required|string|in:multiple_choice,true_false,short_answer,multi_select',
            'question_text' => 'required|string',
            'explanation' => 'nullable|string',
            'points' => 'required|integer|min:1',
            'options' => 'required_unless:type,short_answer|array',
            'options.*.option_text' => 'required|string',
            'options.*.is_correct' => 'required|boolean',
        ]);

        DB::transaction(function () use ($question, $validated) {
            $question->update([
                'type' => $validated['type'],
                'question_text' => $validated['question_text'],
                'explanation' => $validated['explanation'] ?? null,
                'points' => $validated['points'] ?? 1,
            ]);

            $question->options()->delete();

            if (isset($validated['options']) && is_array($validated['options'])) {
                foreach ($validated['options'] as $oIndex => $oData) {
                    $question->options()->create([
                        'option_text' => $oData['option_text'],
                        'is_correct' => (bool) $oData['is_correct'],
                        'order' => $oIndex,
                    ]);
                }
            }
        });

        return back()->with('success', 'Question updated.');
    }

    public function deleteQuestion(Request $request, Course $course, Module $module, Question $question): RedirectResponse
    {
        $this->authorizeOwner($course, $module);

        $question->delete();

        return back()->with('success', 'Question deleted.');
    }

    public function importCsv(Request $request, Course $course, Module $module): RedirectResponse
    {
        $this->authorizeOwner($course, $module);

        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        $assessment = $this->getOrCreateAssessment($request, $course, $module);

        $file = $request->file('csv_file');
        $handle = fopen($file->getRealPath(), 'r');

        $importedCount = 0;
        $rowHeader = fgetcsv($handle); // Read header line

        DB::transaction(function () use ($handle, $assessment, $module, &$importedCount) {
            $order = $assessment->questions()->count();

            while (($row = fgetcsv($handle)) !== false) {
                if (empty($row) || count($row) < 3 || empty(trim($row[0]))) {
                    continue; // Skip empty lines
                }

                $questionText = trim($row[0]);
                $type = isset($row[1]) && in_array(trim($row[1]), ['multiple_choice', 'true_false', 'short_answer', 'multi_select'])
                    ? trim($row[1])
                    : 'multiple_choice';
                $points = isset($row[2]) ? (int) $row[2] : 1;
                $explanation = isset($row[3]) ? trim($row[3]) : null;

                $correctOptionIndex = isset($row[8]) ? (int) trim($row[8]) : 1; // 1-based index (e.g. 1 for option_1)

                $question = $assessment->questions()->create([
                    'module_id' => $module->id,
                    'order' => $order++,
                    'type' => $type,
                    'question_text' => $questionText,
                    'explanation' => $explanation,
                    'points' => max(1, $points),
                ]);

                if ($type === 'short_answer') {
                    $ansText = isset($row[4]) ? trim($row[4]) : 'Correct Answer';
                    $question->options()->create([
                        'option_text' => $ansText,
                        'is_correct' => true,
                        'order' => 0,
                    ]);
                } else {
                    $opts = [
                        ['text' => isset($row[4]) ? trim($row[4]) : '', 'correct' => $correctOptionIndex === 1],
                        ['text' => isset($row[5]) ? trim($row[5]) : '', 'correct' => $correctOptionIndex === 2],
                        ['text' => isset($row[6]) ? trim($row[6]) : '', 'correct' => $correctOptionIndex === 3],
                        ['text' => isset($row[7]) ? trim($row[7]) : '', 'correct' => $correctOptionIndex === 4],
                    ];

                    foreach ($opts as $oIdx => $o) {
                        if (! empty($o['text'])) {
                            $question->options()->create([
                                'option_text' => $o['text'],
                                'is_correct' => $o['correct'],
                                'order' => $oIdx,
                            ]);
                        }
                    }
                }

                $importedCount++;
            }

            fclose($handle);
        });

        return back()->with('success', "Imported {$importedCount} questions.");
    }

    private function getOrCreateAssessment(Request $request, Course $course, Module $module): Assessment
    {
        $assessment = $module->assessments()->latest()->first();

        if (! $assessment) {
            $assessment = $request->user()->assessments()->create([
                'module_id' => $module->id,
                'title' => ($module->code ? "[{$module->code}] " : '') . $module->title . ' Exam',
                'description' => $module->description,
                'subject' => $course->title,
                'settings' => [
                    'show_feedback' => $module->allow_review,
                    'shuffle_questions' => false,
                ],
            ]);
        }

        // Auto-relink any unlinked questions belonging to this module's question bank
        Question::where('module_id', $module->id)
            ->whereNull('assessment_id')
            ->update(['assessment_id' => $assessment->id]);

        return $assessment;
    }

    private function authorizeOwner(Course $course, Module $module): void
    {
        if ($course->user_id !== auth()->id() || $module->course_id !== $course->id) {
            abort(403);
        }
    }
}
