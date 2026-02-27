package com.agilepro.service;

import com.agilepro.controller.UpdateProfileRequest;
import com.agilepro.dto.*;
import com.agilepro.entity.User;
import com.agilepro.exception.ResourceNotFoundException;
import com.agilepro.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public ApiResponse<UserDto> getProfile(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ApiResponse.ok(toDto(user));
    }

    public ApiResponse<UserDto> updateProfile(String email, UpdateProfileRequest req) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (req.fullName()  != null) user.setFullName(req.fullName());
        if (req.phone()     != null) user.setPhone(req.phone());
        if (req.company()   != null) user.setCompany(req.company());
        if (req.jobTitle()  != null) user.setJobTitle(req.jobTitle());
        if (req.country()   != null) user.setCountry(req.country());
        if (req.preferredCurrency() != null) user.setPreferredCurrency(req.preferredCurrency());
        if (req.gstNumber() != null) user.setGstNumber(req.gstNumber());
        return ApiResponse.ok(toDto(userRepository.save(user)), "Profile updated");
    }

    @Transactional(readOnly = true)
    public ApiResponse<Page<UserDto>> listUsers(Pageable pageable) {
        return ApiResponse.ok(userRepository.findAll(pageable).map(this::toDto));
    }

    private UserDto toDto(User u) {
        return UserDto.builder()
            .id(u.getId()).fullName(u.getFullName()).email(u.getEmail())
            .role(u.getRole().name()).provider(u.getProvider().name())
            .emailVerified(u.isEmailVerified()).mfaEnabled(u.isMfaEnabled())
            .avatarUrl(u.getAvatarUrl()).preferredCurrency(u.getPreferredCurrency())
            .company(u.getCompany()).jobTitle(u.getJobTitle()).country(u.getCountry())
            .lastLoginAt(u.getLastLoginAt()).createdAt(u.getCreatedAt()).build();
    }
}
