package com.agilepro.entity;

import com.agilepro.enums.DiscountType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DiscountType discountType;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue;

    private Integer usageLimit;

    @Builder.Default
    private int usageCount = 0;

    private LocalDate expiryDate;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    private String applicableCourseType;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public boolean isValid() {
        if (!active) return false;
        if (usageLimit != null && usageCount >= usageLimit) return false;
        return expiryDate == null || !LocalDate.now().isAfter(expiryDate);
    }
}
