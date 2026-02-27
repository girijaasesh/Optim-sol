package com.agilepro.dto;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CourseDto {
    private Long id;
    private String certificationType;
    private String title;
    private String description;
    private BigDecimal price;
    private BigDecimal earlyBirdPrice;
    private String earlyBirdDeadline;
    private int maxSeats;
    private int seatsRemaining;
    private int durationDays;
    private String format;
    private String zoomLink;
    private String venue;
    private String materialsLink;
    private boolean active;
    private boolean soldOut;
    private String startDate;
    private String endDate;
    private String targetAudience;
    private List<String> learningOutcomes;
    private BigDecimal effectivePrice;
    private boolean earlyBirdActive;
}
