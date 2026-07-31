<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Module extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'title',
        'code',
        'description',
        'exam_duration_minutes',
        'allow_retake',
        'allow_review',
        'hide_score',
        'visibility',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'allow_retake' => 'boolean',
            'allow_review' => 'boolean',
            'hide_score' => 'boolean',
            'exam_duration_minutes' => 'integer',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(Assessment::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class)->orderBy('order');
    }
}
