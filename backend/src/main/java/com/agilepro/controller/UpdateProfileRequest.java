package com.agilepro.controller;
public record UpdateProfileRequest(String fullName, String phone, String company,
    String jobTitle, String country, String preferredCurrency, String gstNumber) {}
