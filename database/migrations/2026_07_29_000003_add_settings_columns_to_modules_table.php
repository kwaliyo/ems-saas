<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            $table->integer('exam_duration_minutes')->nullable()->after('description');
            $table->boolean('allow_retake')->default(false)->after('exam_duration_minutes');
            $table->boolean('allow_review')->default(true)->after('allow_retake');
            $table->boolean('hide_score')->default(false)->after('allow_review');
            $table->string('visibility')->default('published')->after('hide_score'); // published, draft, hidden
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            $table->dropColumn([
                'exam_duration_minutes',
                'allow_retake',
                'allow_review',
                'hide_score',
                'visibility',
            ]);
        });
    }
};
