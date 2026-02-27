package com.agilepro.controller;
import java.util.List;
public record BulkEmailRequest(List<Long> registrationIds, String subject, String body) {}
