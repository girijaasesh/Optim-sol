package com.agilepro.service;

import com.agilepro.dto.*;
import com.agilepro.entity.Coupon;
import com.agilepro.enums.DiscountType;
import com.agilepro.exception.ResourceNotFoundException;
import com.agilepro.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CouponService {

    private final CouponRepository couponRepository;
    private final CurrencyService currencyService;

    public ApiResponse<?> createCoupon(CreateCouponRequest req) {
        if (couponRepository.existsByCodeIgnoreCase(req.getCode())) {
            return ApiResponse.error("Coupon code already exists", "DUPLICATE_CODE");
        }
        Coupon coupon = Coupon.builder()
            .code(req.getCode().toUpperCase())
            .discountType(DiscountType.valueOf(req.getDiscountType().toUpperCase()))
            .discountValue(req.getDiscountValue())
            .usageLimit(req.getUsageLimit())
            .expiryDate(req.getExpiryDate() != null ? LocalDate.parse(req.getExpiryDate()) : null)
            .applicableCourseType(req.getApplicableCourseType())
            .build();
        couponRepository.save(coupon);
        return ApiResponse.ok(null, "Coupon created");
    }

    @Transactional(readOnly = true)
    public ApiResponse<List<Coupon>> listCoupons() {
        return ApiResponse.ok(couponRepository.findAll());
    }

    @Transactional(readOnly = true)
    public CouponValidationResponse validateCoupon(String code, BigDecimal basePrice, String currency) {
        return couponRepository.findByCodeIgnoreCase(code)
            .filter(Coupon::isValid)
            .map(c -> {
                BigDecimal rate = currencyService.getRate(currency);
                BigDecimal discount;
                if (c.getDiscountType() == DiscountType.PERCENTAGE) {
                    discount = basePrice.multiply(c.getDiscountValue())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                } else {
                    discount = c.getDiscountValue().multiply(rate).setScale(2, RoundingMode.HALF_UP);
                }
                return CouponValidationResponse.builder()
                    .valid(true)
                    .discountType(c.getDiscountType().name())
                    .discountValue(c.getDiscountValue())
                    .discountAmount(discount)
                    .message("Coupon applied: " + formatDiscount(c) + " off")
                    .build();
            })
            .orElse(CouponValidationResponse.builder()
                .valid(false)
                .message("Invalid or expired coupon code")
                .build());
    }

    public void incrementUsage(String code) {
        couponRepository.findByCodeIgnoreCase(code).ifPresent(c -> {
            c.setUsageCount(c.getUsageCount() + 1);
            couponRepository.save(c);
        });
    }

    private String formatDiscount(Coupon c) {
        return c.getDiscountType() == DiscountType.PERCENTAGE
            ? c.getDiscountValue().toPlainString() + "%"
            : "$" + c.getDiscountValue().toPlainString();
    }
}
