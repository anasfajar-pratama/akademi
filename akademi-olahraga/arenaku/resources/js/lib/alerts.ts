import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const INK = '#0b1220';
const SLATE = '#64748b';

type AlertIcon = 'warning' | 'question' | 'info' | 'error' | 'success';

export function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => {
        const map: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
        };

        return map[character] ?? character;
    });
}

function messageList(messages: string[]): string {
    return `<ul class="arenaku-swal-list">${messages
        .map((message) => `<li>${escapeHtml(message)}</li>`)
        .join('')}</ul>`;
}

export async function confirmDialog({
    title,
    html,
    confirmText = 'Ya, lanjutkan',
    icon = 'warning',
}: {
    title: string;
    html?: string;
    confirmText?: string;
    icon?: AlertIcon;
}): Promise<boolean> {
    const result = await Swal.fire({
        title,
        html,
        icon,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: 'Batal',
        confirmButtonColor: INK,
        cancelButtonColor: SLATE,
        reverseButtons: true,
        focusCancel: true,
        customClass: { popup: 'arenaku-swal' },
    });

    return result.isConfirmed;
}

export function showMessages(icon: AlertIcon, title: string, messages: string[]): void {
    if (messages.length === 0) {
        return;
    }

    void Swal.fire({
        icon,
        title,
        html: messageList([...new Set(messages)]),
        confirmButtonText: 'Mengerti',
        confirmButtonColor: INK,
        customClass: { popup: 'arenaku-swal' },
    });
}

export function showValidationErrors(errors: object): void {
    const messages = Object.values(errors).filter(
        (value): value is string => typeof value === 'string' && value.length > 0,
    );

    showMessages('error', 'Periksa kembali data', messages);
}
