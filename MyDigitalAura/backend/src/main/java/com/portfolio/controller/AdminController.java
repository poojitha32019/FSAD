package com.portfolio.controller;

import com.portfolio.dto.PortfolioDTO.*;
import com.portfolio.dto.ProjectDTO;
import com.portfolio.repository.ProjectRepository;
import com.portfolio.repository.UserRepository;
import com.portfolio.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Admin management endpoints")
@SecurityRequirement(name = "Bearer Auth")
public class AdminController {

    @Autowired
    private StudentProfileService profileService;
    
    @Autowired
    private ProjectService projectService;
    
    @Autowired
    private FeedbackService feedbackService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ProjectRepository projectRepository;

    // Students
    @GetMapping("/students")
    @Operation(summary = "Get all students")
    public ResponseEntity<List<StudentProfileDTO>> getAllStudents() {
        try {
            System.out.println("AdminController: Getting all students");
            List<StudentProfileDTO> students = profileService.getAllStudents();
            System.out.println("AdminController: Found " + students.size() + " students");
            return ResponseEntity.ok(students);
        } catch (Exception e) {
            System.err.println("Error in AdminController.getAllStudents: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @GetMapping("/students/{userId}/profile")
    @Operation(summary = "Get specific student profile")
    public ResponseEntity<StudentProfileDTO> getStudentProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(profileService.getProfile(userId));
    }

    @DeleteMapping("/students/{userId}")
    @Operation(summary = "Delete a student")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long userId) {
        userRepository.deleteById(userId);
        return ResponseEntity.noContent().build();
    }

    // Projects
    @GetMapping("/projects")
    @Operation(summary = "Get all project submissions")
    public ResponseEntity<List<ProjectDTO>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @PutMapping("/projects/{projectId}/status")
    @Operation(summary = "Approve or reject a project")
    public ResponseEntity<ProjectDTO> updateProjectStatus(
            @PathVariable Long projectId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(projectService.updateStatus(projectId, body.get("status"), body.get("grade")));
    }

    @DeleteMapping("/projects/{projectId}")
    @Operation(summary = "Delete a project")
    public ResponseEntity<Void> deleteProject(@PathVariable Long projectId) {
        projectService.deleteProjectById(projectId);
        return ResponseEntity.noContent().build();
    }

    // Feedback
    @PostMapping("/projects/{projectId}/feedback")
    @Operation(summary = "Give feedback on a project")
    public ResponseEntity<FeedbackDTO> giveFeedback(
            @PathVariable Long projectId,
            @RequestParam Long adminId,
            @RequestBody FeedbackDTO dto) {
        return ResponseEntity.ok(feedbackService.addFeedback(adminId, projectId, dto));
    }

    @PostMapping("/students/{studentId}/feedback")
    @Operation(summary = "Give general feedback on a student portfolio section")
    public ResponseEntity<FeedbackDTO> givePortfolioFeedback(
            @PathVariable Long studentId,
            @RequestParam Long adminId,
            @RequestParam String section,
            @RequestBody FeedbackDTO dto) {
        return ResponseEntity.ok(feedbackService.addGeneralFeedback(adminId, studentId, section, dto));
    }

    @GetMapping("/projects/{projectId}/feedback")
    @Operation(summary = "Get all feedback for a project")
    public ResponseEntity<List<FeedbackDTO>> getProjectFeedback(@PathVariable Long projectId) {
        return ResponseEntity.ok(feedbackService.getFeedbackByProject(projectId));
    }

    // Analytics
    @GetMapping("/analytics")
    @Operation(summary = "Get dashboard analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        long totalStudents = userRepository.countByRole(com.portfolio.entity.User.Role.STUDENT);
        long totalProjects = projectRepository.count();
        long pendingProjects = projectRepository.countByStatus("pending");
        long approvedProjects = projectRepository.countByStatus("approved");
        long rejectedProjects = projectRepository.countByStatus("rejected");

        return ResponseEntity.ok(Map.of(
                "totalStudents", totalStudents,
                "totalProjects", totalProjects,
                "pendingProjects", pendingProjects,
                "approvedProjects", approvedProjects,
                "rejectedProjects", rejectedProjects
        ));
    }
}
