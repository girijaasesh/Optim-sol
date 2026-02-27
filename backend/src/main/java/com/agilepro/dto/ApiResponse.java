package com.agilepro.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.time.LocalDateTime;

@Data @AllArgsConstructor @NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private String errorCode;
    private LocalDateTime timestamp = LocalDateTime.now();

    public static <T> ApiResponse<T> ok(T data, String message) {
        ApiResponse<T> r = new ApiResponse<>(); r.success=true; r.message=message; r.data=data; return r;
    }
    public static <T> ApiResponse<T> ok(T data) { return ok(data, "Success"); }
    public static <T> ApiResponse<T> error(String message, String code) {
        ApiResponse<T> r = new ApiResponse<>(); r.success=false; r.message=message; r.errorCode=code; return r;
    }
}
