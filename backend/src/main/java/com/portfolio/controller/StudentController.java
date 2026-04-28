package com.portfolio.controller;

import com.portfolio.dto.PortfolioDTO.*;
import com.portfolio.dto.ProjectDTO;
import com.portfolio.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student")
@Tag(name = "Student", description = "Student portfolio management")
@SecurityRequirement(name = "Bearer Auth")
public class StudentController {

    @Autowired
    private ProjectService projectService;
    
    @Autowired
    private StudentProfileService profileService;
    
    @Autowired
    private PortfolioItemService itemService;
    
    @Autowired
    private FeedbackService feedbackService;

    @Autowired
    private AuthService authService;

    // Profile
    @GetMapping("/{userId}/profile")
    @Operation(summary = "Get student profile")
    public ResponseEntity<StudentProfileDTO> getProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(profileService.getProfile(userId));
    }

    @PostMapping("/{userId}/profile")
    @Operation(summary = "Save/update student profile")
    public ResponseEntity<StudentProfileDTO> saveProfile(
            @PathVariable Long userId,
            @RequestPart("profile") StudentProfileDTO dto,
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @RequestPart(value = "resume", required = false) MultipartFile resume) {
        return ResponseEntity.ok(profileService.saveProfile(userId, dto, photo, resume));
    }

    // Projects
    @GetMapping("/{userId}/projects")
    public ResponseEntity<List<ProjectDTO>> getProjects(@PathVariable Long userId) {
        return ResponseEntity.ok(projectService.getProjectsByUser(userId));
    }

    @PostMapping("/{userId}/projects")
    public ResponseEntity<ProjectDTO> createProject(
            @PathVariable Long userId,
            @RequestPart("project") ProjectDTO dto,
            @RequestPart(value = "screenshot", required = false) MultipartFile screenshot,
            @RequestPart(value = "projectFile", required = false) MultipartFile projectFile) {
        return ResponseEntity.ok(projectService.createProject(userId, dto, screenshot, projectFile));
    }

    @PutMapping("/{userId}/projects/{projectId}")
    public ResponseEntity<ProjectDTO> updateProject(
            @PathVariable Long userId,
            @PathVariable Long projectId,
            @RequestPart("project") ProjectDTO dto,
            @RequestPart(value = "screenshot", required = false) MultipartFile screenshot,
            @RequestPart(value = "projectFile", required = false) MultipartFile projectFile) {
        return ResponseEntity.ok(projectService.updateProject(projectId, userId, dto, screenshot, projectFile));
    }

    @DeleteMapping("/{userId}/projects/{projectId}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long userId, @PathVariable Long projectId) {
        projectService.deleteProject(projectId, userId);
        return ResponseEntity.noContent().build();
    }

    // Skills
    @GetMapping("/{userId}/skills")
    public ResponseEntity<List<SkillDTO>> getSkills(@PathVariable Long userId) {
        return ResponseEntity.ok(profileService.getSkills(userId));
    }

    @PostMapping("/{userId}/skills")
    public ResponseEntity<SkillDTO> saveSkill(@PathVariable Long userId, @RequestBody SkillDTO dto) {
        return ResponseEntity.ok(itemService.saveSkill(userId, dto));
    }

    @DeleteMapping("/{userId}/skills/{skillId}")
    public ResponseEntity<Void> deleteSkill(@PathVariable Long userId, @PathVariable Long skillId) {
        itemService.deleteSkill(skillId);
        return ResponseEntity.noContent().build();
    }

    // Hackathons
    @GetMapping("/{userId}/hackathons")
    public ResponseEntity<List<HackathonDTO>> getHackathons(@PathVariable Long userId) {
        return ResponseEntity.ok(profileService.getHackathons(userId));
    }

    @PostMapping("/{userId}/hackathons")
    public ResponseEntity<HackathonDTO> saveHackathon(
            @PathVariable Long userId,
            @RequestPart("hackathon") HackathonDTO dto,
            @RequestPart(value = "certificate", required = false) MultipartFile certificate) {
        return ResponseEntity.ok(itemService.saveHackathon(userId, dto, certificate));
    }

    @DeleteMapping("/{userId}/hackathons/{id}")
    public ResponseEntity<Void> deleteHackathon(@PathVariable Long userId, @PathVariable Long id) {
        itemService.deleteHackathon(id);
        return ResponseEntity.noContent().build();
    }

    // Internships
    @GetMapping("/{userId}/internships")
    public ResponseEntity<List<InternshipDTO>> getInternships(@PathVariable Long userId) {
        return ResponseEntity.ok(profileService.getInternships(userId));
    }

    @PostMapping("/{userId}/internships")
    public ResponseEntity<InternshipDTO> saveInternship(@PathVariable Long userId, @RequestBody InternshipDTO dto) {
        return ResponseEntity.ok(itemService.saveInternship(userId, dto));
    }

    @DeleteMapping("/{userId}/internships/{id}")
    public ResponseEntity<Void> deleteInternship(@PathVariable Long userId, @PathVariable Long id) {
        itemService.deleteInternship(id);
        return ResponseEntity.noContent().build();
    }

    // Certifications
    @GetMapping("/{userId}/certifications")
    public ResponseEntity<List<CertificationDTO>> getCertifications(@PathVariable Long userId) {
        return ResponseEntity.ok(profileService.getCertifications(userId));
    }

    @PostMapping("/{userId}/certifications")
    public ResponseEntity<CertificationDTO> saveCertification(@PathVariable Long userId, @RequestBody CertificationDTO dto) {
        return ResponseEntity.ok(itemService.saveCertification(userId, dto));
    }

    @DeleteMapping("/{userId}/certifications/{id}")
    public ResponseEntity<Void> deleteCertification(@PathVariable Long userId, @PathVariable Long id) {
        itemService.deleteCertification(id);
        return ResponseEntity.noContent().build();
    }

    // Feedback received
    @GetMapping("/{userId}/feedback")
    public ResponseEntity<List<FeedbackDTO>> getFeedback(@PathVariable Long userId) {
        return ResponseEntity.ok(feedbackService.getFeedbackForStudent(userId));
    }

    // Feedback for a specific project (inline on project card)
    @GetMapping("/{userId}/projects/{projectId}/feedback")
    public ResponseEntity<List<FeedbackDTO>> getProjectFeedback(
            @PathVariable Long userId, @PathVariable Long projectId) {
        return ResponseEntity.ok(feedbackService.getFeedbackByProject(projectId));
    }

    // Student reply to feedback
    @PutMapping("/{userId}/feedback/{feedbackId}/reply")
    public ResponseEntity<FeedbackDTO> replyToFeedback(
            @PathVariable Long userId,
            @PathVariable Long feedbackId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(feedbackService.replyToFeedback(feedbackId, body.get("reply")));
    }

    // Change password (authenticated user)
    @PostMapping("/{userId}/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @PathVariable Long userId,
            @RequestBody Map<String, String> body) {
        authService.changePassword(userId, body.get("currentPassword"), body.get("newPassword"));
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
