<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParticipantAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'participant_id',
        'question_id',
        'question_text',
        'question_type',
        'points',
        'selected_option_ids',
        'short_answer_text',
        'is_correct',
        'score_awarded',
        'time_taken_seconds',
    ];

    protected function casts(): array
    {
        return [
            'selected_option_ids' => 'array',
            'is_correct' => 'boolean',
        ];
    }

    public function participant(): BelongsTo
    {
        return $this->belongsTo(Participant::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class)->withDefault(function () {
            return new Question([
                'question_text' => $this->question_text ?? 'Question',
                'type' => $this->question_type ?? 'multiple_choice',
                'points' => $this->points ?? 1,
            ]);
        });
    }
}
