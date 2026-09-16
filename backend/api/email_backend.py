import requests
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

# Render's free plan blocks outbound SMTP ports (25, 465, 587), so the
# stock smtplib-based backend hangs then fails on every send_mail() call
# in production. Brevo's API is plain HTTPS, which isn't blocked.
BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


class BrevoAPIEmailBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        sent = 0
        for message in email_messages:
            payload = {
                "sender": {"email": message.from_email},
                "to": [{"email": address} for address in message.to],
                "subject": message.subject,
                "textContent": message.body,
            }
            try:
                response = requests.post(
                    BREVO_API_URL,
                    json=payload,
                    headers={
                        "api-key": settings.BREVO_API_KEY,
                        "content-type": "application/json",
                    },
                    timeout=10,
                )
                response.raise_for_status()
                sent += 1
            except requests.RequestException:
                if not self.fail_silently:
                    raise
        return sent
