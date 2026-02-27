package com.agilepro.dto;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CreateCourseRequest {
    @NotBlank public String certificationType;
    @NotBlank public String title;
    public String description;
    @NotNull public BigDecimal price;
    public BigDecimal earlyBirdPrice;
    public String earlyBirdDeadline;
    @Min(1) @Max(500) public int maxSeats;
    @Min(1) public int durationDays;
    public String format;
    public String zoomLink;
    public String venue;
    public String materialsLink;
    public String startDate;
    public String endDate;
    public String targetAudience;
    public List<String> learningOutcomes;
}
