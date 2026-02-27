package com.agilepro.service;

import com.agilepro.dto.*;
import com.agilepro.entity.Registration;
import com.agilepro.enums.PaymentStatus;
import com.agilepro.enums.RegistrationStatus;
import com.agilepro.exception.ResourceNotFoundException;
import com.agilepro.repository.RegistrationRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.*;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PaymentService {

    private final RegistrationRepository registrationRepository;
    private final EmailService emailService;
    private final WaitlistService waitlistService;

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    // ── Create Stripe Checkout Session ─────────────────────────────
    public ApiResponse<PaymentIntentResponse> createPaymentIntent(CreatePaymentIntentRequest req) {
        Registration reg = registrationRepository.findById(req.getRegistrationId())
            .orElseThrow(() -> new ResourceNotFoundException("Registration", req.getRegistrationId()));

        // Amount in smallest currency unit (cents)
        long amountCents = reg.getAmount().multiply(java.math.BigDecimal.valueOf(100)).longValue();
        String currency = reg.getCurrency().toLowerCase();

        try {
            SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(frontendUrl + "/portal/my-courses?payment=success&ref=" + reg.getRegistrationRef())
                .setCancelUrl(frontendUrl + "/register?payment=cancelled&id=" + reg.getId())
                .addLineItem(SessionCreateParams.LineItem.builder()
                    .setQuantity(1L)
                    .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                        .setCurrency(currency)
                        .setUnitAmount(amountCents)
                        .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                            .setName(reg.getCourse().getTitle())
                            .setDescription("SAFe Certification — " + reg.getRegistrationRef())
                            .build())
                        .build())
                    .build())
                .putMetadata("registrationId", reg.getId().toString())
                .putMetadata("registrationRef", reg.getRegistrationRef())
                .build();

            Session session = Session.create(params);
            reg.setStripeSessionId(session.getId());
            registrationRepository.save(reg);

            return ApiResponse.ok(PaymentIntentResponse.builder()
                .clientSecret(session.getId())   // frontend uses session ID for redirect
                .paymentIntentId(session.getId())
                .amount(reg.getAmount())
                .currency(reg.getCurrency())
                .discountApplied(reg.getDiscountAmount())
                .build(), "Checkout session created");

        } catch (StripeException e) {
            log.error("Stripe error: {}", e.getMessage());
            return ApiResponse.error("Payment initialization failed: " + e.getMessage(), "STRIPE_ERROR");
        }
    }

    // ── Stripe Webhook handler ─────────────────────────────────────
    public void handleWebhook(String payload, String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.warn("Invalid Stripe webhook signature");
            throw new IllegalArgumentException("Invalid webhook signature");
        }

        log.info("Stripe webhook: {}", event.getType());

        switch (event.getType()) {
            case "checkout.session.completed" -> {
                Session session = (Session) event.getDataObjectDeserializer()
                    .getObject().orElseThrow();
                handleCheckoutCompleted(session);
            }
            case "payment_intent.payment_failed" -> {
                PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer()
                    .getObject().orElseThrow();
                handlePaymentFailed(intent);
            }
            case "charge.refunded" -> {
                Charge charge = (Charge) event.getDataObjectDeserializer()
                    .getObject().orElseThrow();
                handleRefund(charge);
            }
            default -> log.debug("Unhandled Stripe event: {}", event.getType());
        }
    }

    private void handleCheckoutCompleted(Session session) {
        String sessionId = session.getId();
        registrationRepository.findAll().stream()
            .filter(r -> sessionId.equals(r.getStripeSessionId()))
            .findFirst()
            .ifPresent(reg -> {
                if (reg.getPaymentStatus() == PaymentStatus.PAID) return; // idempotent
                reg.setPaymentStatus(PaymentStatus.PAID);
                reg.setStatus(RegistrationStatus.CONFIRMED);
                reg.setConfirmedAt(LocalDateTime.now());
                registrationRepository.save(reg);

                String courseDate = reg.getCourse().getStartDate() != null
                    ? reg.getCourse().getStartDate().toString() : "TBD";
                emailService.sendRegistrationConfirmation(
                    reg.getUser().getEmail(), reg.getUser().getFullName(),
                    reg.getRegistrationRef(), reg.getCourse().getTitle(), courseDate);

                log.info("Registration {} confirmed via Stripe", reg.getRegistrationRef());
            });
    }

    private void handlePaymentFailed(PaymentIntent intent) {
        if (intent.getMetadata() != null) {
            String regId = intent.getMetadata().get("registrationId");
            if (regId != null) {
                registrationRepository.findById(Long.parseLong(regId)).ifPresent(reg -> {
                    reg.setPaymentStatus(PaymentStatus.FAILED);
                    registrationRepository.save(reg);
                });
            }
        }
    }

    private void handleRefund(Charge charge) {
        String piId = charge.getPaymentIntent();
        if (piId != null) {
            registrationRepository.findAll().stream()
                .filter(r -> piId.equals(r.getStripePaymentIntentId()))
                .findFirst()
                .ifPresent(reg -> {
                    reg.setPaymentStatus(PaymentStatus.REFUNDED);
                    reg.setStatus(RegistrationStatus.CANCELLED);
                    registrationRepository.save(reg);
                    waitlistService.promoteNextOnWaitlist(reg.getCourse());
                });
        }
    }
}
