package com.portfolio.service;

import com.portfolio.dto.ProjectDTO;
import com.portfolio.entity.Project;
import com.portfolio.entity.User;
import com.portfolio.exception.ResourceNotFoundException;
import com.portfolio.repository.FeedbackRepository;
import com.portfolio.repository.ProjectRepository;
import com.portfolio.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    private static final Logger log = LoggerFactory.getLogger(ProjectService.class);

    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ModelMapper modelMapper;

    @Transactional
    public List<ProjectDTO> getProjectsByUser(Long userId) {
        return projectRepository.findByUserId(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<ProjectDTO> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectDTO createProject(Long userId, ProjectDTO dto, MultipartFile screenshot, MultipartFile projectFile) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = new Project();
        project.setUser(user);
        project.setTitle(dto.getTitle());
        project.setDescription(dto.getDescription());
        project.setTechnologies(dto.getTechnologies());
        project.setRole(dto.getRole());
        project.setPriority(dto.getPriority() != null ? dto.getPriority() : "medium");
        project.setStatus(dto.getStatus() != null ? dto.getStatus() : "not-started");
        project.setProgress(dto.getProgress() != null ? dto.getProgress() : 0);
        project.setDeadline(dto.getDeadline());
        project.setDemo(dto.getDemo());
        project.setGithubLink(dto.getGithubLink());
        project.setSubject(dto.getSubject());
        project.setMilestones(dto.getMilestones());

        if (screenshot != null && !screenshot.isEmpty()) {
            project.setScreenshotPath(saveFile(screenshot, "screenshots"));
        }
        if (projectFile != null && !projectFile.isEmpty()) {
            project.setProjectFilePath(saveFile(projectFile, "projects"));
        }

        Project saved = projectRepository.save(project);
        log.info("Project created: {} by user {}", saved.getTitle(), userId);
        return toDTO(saved);
    }

    @Transactional
    public ProjectDTO updateProject(Long projectId, Long userId, ProjectDTO dto,
                                    MultipartFile screenshot, MultipartFile projectFile) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (!project.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Project not found for this user");
        }

        // Only update fields that are provided — preserves existing values for milestone-only updates
        if (dto.getTitle() != null) project.setTitle(dto.getTitle());
        if (dto.getDescription() != null) project.setDescription(dto.getDescription());
        if (dto.getTechnologies() != null) project.setTechnologies(dto.getTechnologies());
        if (dto.getRole() != null) project.setRole(dto.getRole());
        if (dto.getPriority() != null) project.setPriority(dto.getPriority());
        if (dto.getStatus() != null) project.setStatus(dto.getStatus());
        if (dto.getProgress() != null) project.setProgress(dto.getProgress());
        if (dto.getDeadline() != null) project.setDeadline(dto.getDeadline());
        if (dto.getDemo() != null) project.setDemo(dto.getDemo());
        if (dto.getGithubLink() != null) project.setGithubLink(dto.getGithubLink());
        if (dto.getSubject() != null) project.setSubject(dto.getSubject());
        if (dto.getMilestones() != null) project.setMilestones(dto.getMilestones());

        if (screenshot != null && !screenshot.isEmpty()) {
            project.setScreenshotPath(saveFile(screenshot, "screenshots"));
        }
        if (projectFile != null && !projectFile.isEmpty()) {
            project.setProjectFilePath(saveFile(projectFile, "projects"));
        }

        return toDTO(projectRepository.save(project));
    }

    @Transactional
    public void deleteProject(Long projectId, Long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        if (!project.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Project not found for this user");
        }
        // Delete all feedback for this project first to avoid FK constraint violation
        feedbackRepository.deleteAll(feedbackRepository.findByProjectId(projectId));
        projectRepository.delete(project);
    }

    @Transactional
    public void deleteProjectById(Long projectId) {
        feedbackRepository.deleteAll(feedbackRepository.findByProjectId(projectId));
        projectRepository.deleteById(projectId);
    }

    @Transactional
    public ProjectDTO updateStatus(Long projectId, String status, String grade) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        project.setStatus(status);
        if (grade != null) project.setGrade(grade);
        return toDTO(projectRepository.save(project));
    }

    private String saveFile(MultipartFile file, String subDir) {
        try {
            Path uploadPath = Paths.get("uploads/" + subDir);
            Files.createDirectories(uploadPath);
            String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), uploadPath.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            return subDir + "/" + filename;
        } catch (IOException e) {
            log.error("File upload failed: {}", e.getMessage());
            return null;
        }
    }

    private ProjectDTO toDTO(Project p) {
        ProjectDTO dto = new ProjectDTO();
        dto.setId(p.getId());
        dto.setUserId(p.getUser().getId());
        dto.setStudentName(p.getUser().getFirstName() + " " + p.getUser().getLastName());
        dto.setTitle(p.getTitle());
        dto.setDescription(p.getDescription());
        dto.setTechnologies(p.getTechnologies());
        dto.setRole(p.getRole());
        dto.setPriority(p.getPriority());
        dto.setStatus(p.getStatus());
        dto.setProgress(p.getProgress());
        dto.setDeadline(p.getDeadline());
        dto.setDemo(p.getDemo());
        dto.setGithubLink(p.getGithubLink());
        dto.setSubject(p.getSubject());
        dto.setGrade(p.getGrade());
        dto.setMilestones(p.getMilestones());
        dto.setScreenshotPath(p.getScreenshotPath());
        dto.setProjectFilePath(p.getProjectFilePath());
        dto.setCreatedAt(p.getCreatedAt());
        return dto;
    }
}
