<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

class SystemAnnouncement extends Model
{
    use HasFactory;

    protected $fillable = [
        'enabled',
        'announcement_id',
        'message',
        'type',
        'link_text',
        'link_url',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
        ];
    }

    public static function getActivePayload(): array
    {
        if (! Schema::hasTable('system_announcements')) {
            return [
                'enabled' => false,
                'id' => 'ann-default',
                'message' => '',
                'type' => 'info',
                'link_text' => null,
                'link_url' => null,
            ];
        }

        try {
            $announcement = static::latest()->first();
        } catch (\Throwable $e) {
            $announcement = null;
        }

        if (! $announcement) {
            return [
                'enabled' => false,
                'id' => 'ann-default',
                'message' => '',
                'type' => 'info',
                'link_text' => null,
                'link_url' => null,
            ];
        }

        return [
            'enabled' => (bool) $announcement->enabled,
            'id' => $announcement->announcement_id,
            'message' => $announcement->message,
            'type' => $announcement->type ?: 'info',
            'link_text' => $announcement->link_text,
            'link_url' => $announcement->link_url,
        ];
    }
}
