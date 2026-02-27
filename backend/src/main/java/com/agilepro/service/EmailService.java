package com.agilepro.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendVerificationEmail(String to, String name, String token) {
        String link = frontendUrl + "/auth/verify-email?token=" + token;
        String html = """
            <div style="font-family:'Outfit',sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
              <div style="background:#0b0e17;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
                <h1 style="color:#c8983a;font-family:Georgia,serif;margin:0;font-size:1.5rem;">AgilePro Institute</h1>
              </div>
              <div style="background:#fff;border:1px solid #e2e4eb;border-radius:0 0 12px 12px;padding:40px;">
                <h2 style="color:#1a1612;margin-top:0;">Verify your email address</h2>
                <p style="color:#6b6358;line-height:1.7;">Hi %s,</p>
                <p style="color:#6b6358;line-height:1.7;">
                  Thank you for registering with AgilePro Institute. Please verify your email address to complete your account setup.
                </p>
                <div style="text-align:center;margin:32px 0;">
                  <a href="%s" style="background:#0b0e17;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;">
                    Verify Email Address
                  </a>
                </div>
                <p style="color:#9b9289;font-size:0.85rem;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
              </div>
            </div>
            """.formatted(name, link);
        sendHtmlEmail(to, "Verify your AgilePro Institute account", html);
    }

    @Async
    public void sendPasswordResetEmail(String to, String name, String token) {
        String link = frontendUrl + "/auth/reset-password?token=" + token;
        String html = """
            <div style="font-family:'Outfit',sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
              <div style="background:#0b0e17;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
                <h1 style="color:#c8983a;font-family:Georgia,serif;margin:0;font-size:1.5rem;">AgilePro Institute</h1>
              </div>
              <div style="background:#fff;border:1px solid #e2e4eb;border-radius:0 0 12px 12px;padding:40px;">
                <h2 style="color:#1a1612;margin-top:0;">Reset your password</h2>
                <p style="color:#6b6358;line-height:1.7;">Hi %s,</p>
                <p style="color:#6b6358;line-height:1.7;">
                  We received a request to reset your password. Click the button below to set a new password.
                </p>
                <div style="text-align:center;margin:32px 0;">
                  <a href="%s" style="background:#1b6b72;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;">
                    Reset Password
                  </a>
                </div>
                <p style="color:#9b9289;font-size:0.85rem;">This link expires in 2 hours. If you didn't request this, please ignore this email.</p>
              </div>
            </div>
            """.formatted(name, link);
        sendHtmlEmail(to, "Reset your AgilePro Institute password", html);
    }

    @Async
    public void sendRegistrationConfirmation(String to, String name, String ref, String courseTitle, String courseDate) {
        String html = """
            <div style="font-family:'Outfit',sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
              <div style="background:#0b0e17;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
                <h1 style="color:#c8983a;font-family:Georgia,serif;margin:0;font-size:1.5rem;">AgilePro Institute</h1>
              </div>
              <div style="background:#fff;border:1px solid #e2e4eb;border-radius:0 0 12px 12px;padding:40px;">
                <h2 style="color:#1a1612;margin-top:0;">✅ Registration Confirmed!</h2>
                <p style="color:#6b6358;line-height:1.7;">Hi %s,</p>
                <p style="color:#6b6358;line-height:1.7;">
                  Your registration for <strong>%s</strong> has been confirmed.
                </p>
                <div style="background:#f5f5f1;border-radius:8px;padding:20px;margin:24px 0;">
                  <p style="margin:4px 0;color:#1a1612;"><strong>Registration ID:</strong> %s</p>
                  <p style="margin:4px 0;color:#1a1612;"><strong>Course:</strong> %s</p>
                  <p style="margin:4px 0;color:#1a1612;"><strong>Date:</strong> %s</p>
                </div>
                <p style="color:#6b6358;line-height:1.7;">
                  Course materials and joining instructions will be sent 48 hours before the session. Log in to your participant portal to access resources.
                </p>
                <div style="text-align:center;margin:32px 0;">
                  <a href="%s/portal/my-courses" style="background:#0b0e17;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;">
                    View My Courses
                  </a>
                </div>
              </div>
            </div>
            """.formatted(name, courseTitle, ref, courseTitle, courseDate, frontendUrl);
        sendHtmlEmail(to, "Registration Confirmed — " + courseTitle, html);
    }

    @Async
    public void sendCertificateEmail(String to, String name, String certId, String certTitle) {
        String html = """
            <div style="font-family:'Outfit',sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
              <div style="background:#0b0e17;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
                <h1 style="color:#c8983a;font-family:Georgia,serif;margin:0;font-size:1.5rem;">AgilePro Institute</h1>
              </div>
              <div style="background:#fff;border:1px solid #e2e4eb;border-radius:0 0 12px 12px;padding:40px;text-align:center;">
                <div style="font-size:3rem;margin-bottom:16px;">🏆</div>
                <h2 style="color:#1a1612;margin-top:0;">Congratulations, %s!</h2>
                <p style="color:#6b6358;line-height:1.7;">
                  Your <strong>%s</strong> certificate is ready. Certificate ID: <strong>%s</strong>
                </p>
                <div style="text-align:center;margin:32px 0;">
                  <a href="%s/portal/certificates" style="background:#c8983a;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;">
                    Download Certificate
                  </a>
                </div>
              </div>
            </div>
            """.formatted(name, certTitle, certId, frontendUrl);
        sendHtmlEmail(to, "Your " + certTitle + " Certificate is Ready!", html);
    }

    @Async
    public void sendWaitlistNotification(String to, String name, String courseTitle, String registrationLink) {
        String html = """
            <div style="font-family:'Outfit',sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
              <div style="background:#0b0e17;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
                <h1 style="color:#c8983a;font-family:Georgia,serif;margin:0;font-size:1.5rem;">AgilePro Institute</h1>
              </div>
              <div style="background:#fff;border:1px solid #e2e4eb;border-radius:0 0 12px 12px;padding:40px;">
                <h2 style="color:#1a1612;margin-top:0;">A spot has opened up!</h2>
                <p style="color:#6b6358;line-height:1.7;">Hi %s,</p>
                <p style="color:#6b6358;line-height:1.7;">
                  Great news! A spot has become available for <strong>%s</strong>. You have <strong>48 hours</strong> to complete your registration.
                </p>
                <div style="text-align:center;margin:32px 0;">
                  <a href="%s" style="background:#1b6b72;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;">
                    Register Now →
                  </a>
                </div>
                <p style="color:#9b9289;font-size:0.85rem;">This offer expires in 48 hours. If not claimed, the next person on the waitlist will be notified.</p>
              </div>
            </div>
            """.formatted(name, courseTitle, registrationLink);
        sendHtmlEmail(to, "Spot Available — " + courseTitle, html);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, "AgilePro Institute");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to {} — {}", to, subject);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    @Async
    public void sendHtmlBulkEmail(String to, String name, String subject, String body) {
        String html = """
            <div style="font-family:'Outfit',sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
              <div style="background:#0b0e17;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
                <h1 style="color:#c8983a;font-family:Georgia,serif;margin:0;font-size:1.5rem;">AgilePro Institute</h1>
              </div>
              <div style="background:#fff;border:1px solid #e2e4eb;border-radius:0 0 12px 12px;padding:40px;">
                <p style="color:#6b6358;line-height:1.7;">Hi %s,</p>
                <div style="color:#1a1612;line-height:1.8;">%s</div>
              </div>
            </div>
            """.formatted(name, body);
        sendHtmlEmail(to, subject, html);
    }
}
