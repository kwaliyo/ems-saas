<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'created_by_user_id',
        'student_number',
        'first_name',
        'middle_name',
        'surname',
        'gender',
        'date_of_birth',
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'date_of_birth' => 'date:Y-m-d',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(Assessment::class);
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }

    public function taughtCourses(): HasMany
    {
        return $this->hasMany(Course::class, 'user_id');
    }

    public function enrolledCourses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'course_user');
    }

    public static function generateNextStudentNumber(): string
    {
        $year = date('Y');
        $prefix = "STU-{$year}-";

        $existingNumbers = static::where('student_number', 'like', "{$prefix}%")
            ->pluck('student_number')
            ->map(function ($num) use ($prefix) {
                $suffix = str_replace($prefix, '', $num);
                return is_numeric($suffix) ? (int) $suffix : 0;
            })
            ->filter();

        $maxNumber = $existingNumbers->max() ?? 0;
        $nextSeq = $maxNumber + 1;

        return $prefix . str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);
    }

    public static function generateNextExternalStudentNumber(string $rawPrefix = 'EXT'): string
    {
        $year = date('Y');
        $cleanPrefix = strtoupper(preg_replace('/[^A-Z0-9]/i', '', $rawPrefix) ?: 'EXT');
        $tag = "{$cleanPrefix}-{$year}-";

        $existingNumbers = static::where('student_number', 'like', "{$tag}%")
            ->pluck('student_number')
            ->map(function ($num) use ($tag) {
                $suffix = str_replace($tag, '', $num);
                return is_numeric($suffix) ? (int) $suffix : 0;
            })
            ->filter();

        $maxNumber = $existingNumbers->max() ?? 0;
        $nextSeq = $maxNumber + 1;

        return $tag . str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);
    }
}
