<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccountCredentialsNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $academyName,
        public string $plainPassword,
        public string $loginUrl,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Akun Arenaku Anda')
            ->greeting('Halo '.$notifiable->name.',')
            ->line('Akun Anda untuk '.$this->academyName.' sudah dibuat.')
            ->line('Masuk dengan: '.($notifiable->email ?? $notifiable->phone))
            ->line('Kata sandi sementara: '.$this->plainPassword)
            ->action('Masuk sekarang', $this->loginUrl)
            ->line('Demi keamanan, Anda wajib mengganti kata sandi saat pertama kali masuk.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'academy' => $this->academyName,
        ];
    }
}
