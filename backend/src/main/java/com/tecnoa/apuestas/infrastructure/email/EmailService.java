package com.tecnoa.apuestas.infrastructure.email;

import com.tecnoa.apuestas.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final AppProperties props;

    public EmailService(JavaMailSender mailSender, AppProperties props) {
        this.mailSender = mailSender;
        this.props = props;
    }

    @Async
    public void sendVerificationEmail(String toEmail, String userName, String token) {
        String verificationUrl = props.mail().verificationUrl() + "/" + token;
        String subject = "Verifica tu correo en TECnoa";
        String body = buildVerificationBody(userName, verificationUrl, props.mail().tokenExpiryHours());

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(props.mail().from());
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);
            log.info("Verification email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String userName, String token) {
        String resetUrl = (props.app() != null ? props.app().baseUrl() : "http://localhost:8080") + "/reset-password?token=" + token;
        String subject = "Restablece tu contraseña en TECnoa";
        String body = buildPasswordResetBody(userName, resetUrl);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(props.mail().from());
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);
            log.info("Password reset email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendWelcomeEmail(String toEmail, String userName) {
        String subject = "¡Bienvenido a TECnoa!";
        String body = buildWelcomeBody(userName);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(props.mail().from());
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);
            log.info("Welcome email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send welcome email to {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildVerificationBody(String name, String url, int expiryHours) {
        return "<html><body style=\"font-family:sans-serif;color:#1a1a2e\">" +
                "<h2>Hola " + name + " 👋</h2>" +
                "<p>Haz clic en el botón para verificar tu correo en TECnoa:</p>" +
                "<a href=\"" + url + "\" style=\"display:inline-block;padding:14px 24px;background:#c5f135;color:#1a1a1a;border-radius:8px;font-weight:700;text-decoration:none\">Verificar correo</a>" +
                "<p style=\"color:#888;font-size:12px;margin-top:24px\">Este enlace expira en " + expiryHours + " horas. Si no solicitaste esto, ignora este mensaje.</p>" +
                "</body></html>";
    }

    private String buildPasswordResetBody(String name, String url) {
        return "<html><body style=\"font-family:sans-serif;color:#1a1a2e\">" +
                "<h2>Hola " + name + " 👋</h2>" +
                "<p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón:</p>" +
                "<a href=\"" + url + "\" style=\"display:inline-block;padding:14px 24px;background:#c5f135;color:#1a1a1a;border-radius:8px;font-weight:700;text-decoration:none\">Restablecer contraseña</a>" +
                "<p style=\"color:#888;font-size:12px;margin-top:24px\">Este enlace expira en 1 hora. Si no solicitaste esto, ignora este mensaje.</p>" +
                "</body></html>";
    }

    private String buildWelcomeBody(String name) {
        return "<html><body style=\"font-family:sans-serif;color:#1a1a2e\">" +
                "<h2>¡Bienvenido a TECnoa, " + name + "! 🎉</h2>" +
                "<p>Tu cuenta está lista. ¡Empieza a hacer predicciones y compite con tus amigos!</p>" +
                "<p style=\"color:#888;font-size:12px;margin-top:24px\">¡Buena suerte!<br>El equipo de TECnoa</p>" +
                "</body></html>";
    }
}
