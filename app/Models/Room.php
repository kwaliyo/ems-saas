<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'assessment_id',
        'assessment_title',
        'assessment_subject',
        'code',
        'mode',
        'status',
        'current_question_index',
        'settings',
        'questions_snapshot',
        'started_at',
        'ended_at',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'questions_snapshot' => 'array',
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    public static function generateUniqueCode(): string
    {
        do {
            $code = strtoupper(Str::random(6));
        } while (static::where('code', $code)->whereIn('status', ['waiting', 'active', 'paused'])->exists());

        return $code;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class)->withDefault(function () {
            return new Assessment([
                'title' => $this->assessment_title ?? 'Archived Assessment',
                'subject' => $this->assessment_subject ?? 'General',
            ]);
        });
    }

    public function participants(): HasMany
    {
        return $this->hasMany(Participant::class);
    }

    public function ensureQuestionsLoaded(): void
    {
        if ($this->assessment && $this->assessment->relationLoaded('questions') && $this->assessment->questions->isNotEmpty()) {
            return;
        }

        if ($this->assessment && (! $this->assessment->questions || $this->assessment->questions->isEmpty()) && ! empty($this->questions_snapshot)) {
            $snapshotQuestions = collect($this->questions_snapshot)->map(function ($q) {
                $question = new Question([
                    'type' => $q['type'] ?? 'multiple_choice',
                    'question_text' => $q['question_text'] ?? '',
                    'explanation' => $q['explanation'] ?? null,
                    'points' => $q['points'] ?? 1,
                    'order' => $q['order'] ?? 0,
                ]);
                if (isset($q['id'])) {
                    $question->id = $q['id'];
                }
                if (isset($q['options']) && is_array($q['options'])) {
                    $opts = collect($q['options'])->map(function ($o) {
                        $opt = new QuestionOption([
                            'option_text' => $o['option_text'] ?? '',
                            'is_correct' => $o['is_correct'] ?? false,
                            'order' => $o['order'] ?? 0,
                        ]);
                        if (isset($o['id'])) {
                            $opt->id = $o['id'];
                        }
                        return $opt;
                    });
                    $question->setRelation('options', $opts);
                }
                return $question;
            });
            $this->assessment->setRelation('questions', $snapshotQuestions);
        }
    }
}
