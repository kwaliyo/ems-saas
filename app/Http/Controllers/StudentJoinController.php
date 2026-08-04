<?php

namespace App\Http\Controllers;

use App\Models\Participant;
use App\Models\ParticipantAnswer;
use App\Models\Question;
use App\Models\Room;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class StudentJoinController extends Controller
{
    public function joinPage(Request $request, ?string $code = null): Response
    {
        $code = $code ?: $request->query('code');
        $studentId = $request->query('student_id');

        return Inertia::render('student/JoinRoom', [
            'initialCode' => $code ? strtoupper(trim($code)) : '',
            'initialStudentId' => $studentId ? trim($studentId) : '',
        ]);
    }

    public function joinSubmit(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'student_id_code' => 'nullable|string|max:100',
            'name' => 'nullable|string|max:100',
        ]);

        if (empty($validated['student_id_code']) && empty($validated['name'])) {
            return back()->withErrors(['student_id_code' => 'Please enter your Student Number or ID.']);
        }

        $code = strtoupper(trim($validated['code']));
        $room = Room::where('code', $code)->whereIn('status', ['waiting', 'active', 'paused'])->first();

        if (! $room) {
            return back()->withErrors(['code' => 'Room code not found or room is closed.']);
        }

        if ($room->status === 'paused') {
            return back()->withErrors(['code' => 'This room is currently paused by the instructor.']);
        }

        $studentCode = ! empty($validated['student_id_code'])
            ? trim($validated['student_id_code'])
            : trim($validated['name']);

        // Look up student profile in database by student_number or email
        $studentUser = User::where('student_number', $studentCode)
            ->orWhere('email', strtolower($studentCode))
            ->first();

        $displayName = $studentUser
            ? ($studentUser->name ?: trim("{$studentUser->first_name} {$studentUser->surname}"))
            : (! empty($validated['name']) ? trim($validated['name']) : $studentCode);

        // Block Guest Candidates if allow_guests setting is explicitly set to false
        $allowGuests = isset($room->settings['allow_guests']) ? (bool) $room->settings['allow_guests'] : true;
        $isGuestCandidate = (
            str_starts_with(strtoupper($studentCode), 'EXT-') ||
            str_starts_with(strtoupper($studentCode), 'GST-') ||
            str_ends_with(strtolower($studentCode), '@guest.exam') ||
            ($studentUser && (
                (isset($studentUser->student_number) && (str_starts_with(strtoupper($studentUser->student_number), 'EXT-') || str_starts_with(strtoupper($studentUser->student_number), 'GST-'))) ||
                (isset($studentUser->email) && str_ends_with(strtolower($studentUser->email), '@guest.exam'))
            ))
        );

        if (! $allowGuests && $isGuestCandidate) {
            return back()->withErrors([
                'student_id_code' => 'Access Denied: Guest candidate IDs (EXT-*) are not permitted for this official assessment. Enrolled students must use their registered Student Number.',
            ]);
        }

        // Strict Course Enrollment Check
        $course = $room->assessment?->module?->course;

        if ($course && $course->students()->exists()) {
            $isEnrolled = false;

            // 1. Authenticated user check
            if (auth()->check()) {
                $isEnrolled = $course->students()->where('users.id', auth()->id())->exists();
            }

            // 2. studentUser check
            if (! $isEnrolled && $studentUser) {
                $isEnrolled = $course->students()->where('users.id', $studentUser->id)->exists();
            }

            // 3. Direct Student Number / Email / Name check in course roster
            if (! $isEnrolled) {
                $isEnrolled = $course->students()
                    ->where(function ($query) use ($studentCode, $validated) {
                        $query->where('users.student_number', $studentCode)
                            ->orWhere('users.email', strtolower($studentCode));

                        if (! empty($validated['name'])) {
                            $query->orWhereRaw('LOWER(users.name) = ?', [strtolower(trim($validated['name']))]);
                        }
                    })->exists();
            }

            if (! $isEnrolled) {
                return back()->withErrors([
                    'code' => "Access Denied: Student \"{$studentCode}\" is not enrolled in course \"{$course->title}\".",
                    'student_id_code' => "Access Denied: Student Number / ID \"{$studentCode}\" is not enrolled in course \"{$course->title}\".",
                ]);
            }
        }

        // Check if candidate already joined this room
        $existingParticipant = $room->participants()
            ->where(function ($query) use ($studentCode, $displayName, $studentUser) {
                $query->whereRaw('LOWER(student_id_code) = ?', [strtolower($studentCode)])
                    ->orWhereRaw('LOWER(name) = ?', [strtolower($displayName)])
                    ->orWhereRaw('LOWER(name) = ?', [strtolower($studentCode)]);

                if ($studentUser) {
                    if ($studentUser->student_number) {
                        $query->orWhereRaw('LOWER(student_id_code) = ?', [strtolower($studentUser->student_number)]);
                    }
                    if ($studentUser->email) {
                        $query->orWhereRaw('LOWER(student_id_code) = ?', [strtolower($studentUser->email)]);
                    }
                    if ($studentUser->name) {
                        $query->orWhereRaw('LOWER(name) = ?', [strtolower($studentUser->name)]);
                    }
                }
            })
            ->first();

        if ($existingParticipant) {
            $room->load(['assessment.module']);
            $module = $room->assessment?->module;
            $allowRetake = (bool) ($module ? $module->allow_retake : ($room->settings['allow_retake'] ?? false));

            if ($existingParticipant->completed_at !== null) {
                if (! $allowRetake) {
                    $completedTime = $existingParticipant->completed_at->format('M d, Y H:i');

                    return back()->withErrors([
                        'code' => "Attempt Blocked: Candidate \"{$existingParticipant->name}\" ({$studentCode}) has already completed and submitted this examination paper on {$completedTime}. Retaking this assessment is disabled by your instructor.",
                        'student_id_code' => "Exam Already Submitted: Candidate ID \"{$studentCode}\" has already completed this assessment.",
                    ]);
                }

                // If retakes ARE allowed ($allowRetake === true), reset participant state for a fresh retake attempt
                $newSessionToken = Str::uuid()->toString();
                $existingParticipant->update([
                    'session_token' => $newSessionToken,
                    'completed_at' => null,
                    'score' => 0,
                ]);
                ParticipantAnswer::where('participant_id', $existingParticipant->id)->delete();

                return redirect()->route('student.room', [
                    'room' => $room->id,
                    'token' => $newSessionToken,
                ]);
            }

            // Reconnect candidate to their active session token if exam is in-progress
            return redirect()->route('student.room', [
                'room' => $room->id,
                'token' => $existingParticipant->session_token,
            ]);
        }

        // Enforce instructor subscription candidate seat limit
        $instructor = $room->user;
        if ($instructor) {
            $maxLimit = $instructor->maxCandidateLimit();
            $currentCandidates = $room->participants()->count();
            if ($currentCandidates >= $maxLimit) {
                return back()->withErrors([
                    'code' => "Candidate Capacity Exceeded: This exam room has reached its limit of {$maxLimit} candidates under the instructor's subscription plan.",
                ]);
            }
        }

        $sessionToken = Str::uuid()->toString();

        // Assign team colors for space race
        $teamColors = ['blue', 'rocket-red', 'emerald', 'amber', 'purple', 'cyan'];
        $assignedColor = $teamColors[crc32($displayName) % count($teamColors)];

        $participant = $room->participants()->create([
            'name' => $displayName,
            'student_id_code' => $studentCode,
            'session_token' => $sessionToken,
            'team_color' => $assignedColor,
            'score' => 0,
            'total_questions' => $room->assessment ? $room->assessment->questions()->count() : count($room->questions_snapshot ?? []),
        ]);

        return redirect()->route('student.room', [
            'room' => $room->id,
            'token' => $sessionToken,
        ]);
    }

    public function studentRoom(Room $room, string $token): Response|RedirectResponse
    {
        $participant = $room->participants()->where('session_token', $token)->first();

        if (! $participant) {
            return redirect()->route('join.page')->withErrors(['code' => 'Invalid or expired student session.']);
        }

        $room->load(['assessment.module']);
        $assessment = $room->assessment;

        if ($assessment && $assessment->id) {
            $assessment->load(['questions' => function ($q) {
                $q->orderBy('order', 'asc')->with('options');
            }]);
        } elseif (! empty($room->questions_snapshot)) {
            $assessment = [
                'id' => 0,
                'title' => $room->assessment_title ?? ($room->code.' Assessment'),
                'subject' => $room->assessment_subject ?? 'General',
                'questions' => $room->questions_snapshot,
            ];
        } else {
            $assessment = [
                'id' => 0,
                'title' => $room->assessment_title ?? ($room->code.' Assessment'),
                'subject' => $room->assessment_subject ?? 'General',
                'questions' => [],
            ];
        }

        $answers = ParticipantAnswer::where('participant_id', $participant->id)
            ->get()
            ->keyBy('question_id');

        $module = $room->assessment?->module;
        $allowRetake = (bool) ($module ? $module->allow_retake : ($room->settings['allow_retake'] ?? false));
        $allowReview = (bool) ($module ? $module->allow_review : ($room->settings['allow_review'] ?? true));
        $hideScore = (bool) ($module ? $module->hide_score : ($room->settings['hide_score'] ?? false));

        $mergedSettings = array_merge($room->settings ?? [], [
            'allow_retake' => $allowRetake,
            'allow_review' => $allowReview,
            'hide_score' => $hideScore,
        ]);

        return Inertia::render('student/StudentRoom', [
            'room' => [
                'id' => $room->id,
                'code' => $room->code,
                'mode' => $room->mode,
                'status' => $room->status,
                'current_question_index' => $room->current_question_index,
                'assessment' => $assessment,
                'settings' => $mergedSettings,
            ],
            'participant' => [
                'id' => $participant->id,
                'name' => $participant->name,
                'student_id_code' => $participant->student_id_code,
                'session_token' => $participant->session_token,
                'score' => $participant->score,
                'completed_at' => $participant->completed_at,
            ],
            'answers' => $answers,
        ]);
    }

    public function studentState(Room $room, string $token): JsonResponse
    {
        $participant = $room->participants()->where('session_token', $token)->first();

        if (! $participant) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $answers = ParticipantAnswer::where('participant_id', $participant->id)->get();

        $isCompleted = $participant->completed_at !== null || $room->status === 'completed';

        // Do not leak per-question correctness while the exam is live unless the
        // instructor enabled feedback; otherwise strip it from the poll payload.
        $module = $room->assessment?->module;
        $showFeedback = (bool) ($module
            ? $module->allow_review
            : ($room->settings['show_feedback'] ?? false));

        $answersPayload = $answers->map(function ($answer) use ($showFeedback, $isCompleted) {
            $data = [
                'question_id' => $answer->question_id,
                'selected_option_ids' => $answer->selected_option_ids,
                'text_answer' => $answer->text_answer,
            ];

            if ($showFeedback || $isCompleted) {
                $data['is_correct'] = $answer->is_correct;
                $data['score_awarded'] = $answer->score_awarded;
            }

            return $data;
        });

        return response()->json([
            'status' => $room->status,
            'room_status' => $room->status,
            'current_question_index' => $room->current_question_index,
            'participant_score' => ($showFeedback || $isCompleted) ? $participant->score : null,
            'completed_at' => $participant->completed_at ? $participant->completed_at->toISOString() : null,
            'is_completed' => $isCompleted,
            'answers' => $answersPayload,
        ]);
    }

    public function submitAnswer(Request $request, Room $room, string $token): JsonResponse
    {
        $participant = $room->participants()->where('session_token', $token)->first();

        if (! $participant || $room->status === 'completed' || $room->status === 'paused' || $participant->completed_at !== null) {
            return response()->json(['error' => 'Room is locked or assessment has concluded.'], 403);
        }

        $validated = $request->validate([
            'question_id' => 'required|integer|exists:questions,id',
            'option_ids' => 'nullable|array',
            'selected_option_ids' => 'nullable|array',
            'short_answer' => 'nullable|string',
        ]);

        $optionIds = $validated['selected_option_ids'] ?? $validated['option_ids'] ?? [];

        $question = Question::with('options')->find($validated['question_id']);
        if (! $question) {
            return response()->json(['error' => 'Question not found'], 404);
        }

        $isCorrect = false;
        $scoreAwarded = 0;

        if ($question->type === 'multiple_choice' || $question->type === 'true_false') {
            $selectedOptId = $optionIds[0] ?? null;
            if ($selectedOptId) {
                $opt = $question->options->firstWhere('id', $selectedOptId);
                if ($opt && $opt->is_correct) {
                    $isCorrect = true;
                    $scoreAwarded = $question->points;
                }
            }
        } elseif ($question->type === 'multi_select') {
            $selectedOptIds = array_map('intval', $optionIds);
            $correctOptIds = $question->options->where('is_correct', true)->pluck('id')->toArray();
            sort($selectedOptIds);
            sort($correctOptIds);
            if ($selectedOptIds === $correctOptIds) {
                $isCorrect = true;
                $scoreAwarded = $question->points;
            }
        } elseif ($question->type === 'short_answer') {
            $given = strtolower(trim($validated['short_answer'] ?? ''));
            $correctOpts = $question->options->where('is_correct', true)->pluck('option_text')->map(fn ($t) => strtolower(trim($t)))->toArray();
            if (in_array($given, $correctOpts)) {
                $isCorrect = true;
                $scoreAwarded = $question->points;
            }
        }

        // The auto-save UI legitimately re-sends an answer while a question is
        // open (e.g. building a multi_select set, changing a choice), so answers
        // are upserted rather than locked after first submit. The guess-and-check
        // exploit is closed below by never leaking correctness unless the
        // instructor enabled live feedback.
        ParticipantAnswer::updateOrCreate(
            [
                'participant_id' => $participant->id,
                'question_id' => $question->id,
            ],
            [
                'selected_option_ids' => $optionIds,
                'text_answer' => $validated['short_answer'] ?? null,
                'is_correct' => $isCorrect,
                'score_awarded' => $scoreAwarded,
            ]
        );

        // Recalculate total participant score
        $totalScore = ParticipantAnswer::where('participant_id', $participant->id)->sum('score_awarded');
        $participant->update(['score' => $totalScore]);

        // Only reveal correctness / running score when the instructor enabled
        // live feedback for this room. Returning it unconditionally exposed the
        // answer key and enabled retry-until-correct.
        $module = $room->assessment?->module;
        $showFeedback = (bool) ($module
            ? $module->allow_review
            : ($room->settings['show_feedback'] ?? true));

        $response = ['success' => true, 'recorded' => true];
        if ($showFeedback) {
            $response['is_correct'] = $isCorrect;
            $response['score_awarded'] = $scoreAwarded;
            $response['total_score'] = (int) $totalScore;
        }

        return response()->json($response);
    }

    public function completeExam(Room $room, string $token): JsonResponse
    {
        $participant = $room->participants()->where('session_token', $token)->first();

        if (! $participant) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $participant->update(['completed_at' => now()]);

        return response()->json([
            'success' => true,
            'completed_at' => $participant->completed_at,
        ]);
    }
}
