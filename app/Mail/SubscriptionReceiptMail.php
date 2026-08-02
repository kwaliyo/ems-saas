<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SubscriptionReceiptMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $plan,
        public string $amount,
        public string $reference,
        public string $seatLimit,
        public string $paymentDate,
        public string $expiresAt
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Official K-EMS Subscription Receipt ('.strtoupper($this->plan).' Plan)',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.subscription-receipt',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
