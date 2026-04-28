package com.portfolio.service;

import com.portfolio.dto.PortfolioDTO.FeedbackDTO;
import com.portfolio.entity.Feedback;
import com.portfolio.entity.Project;
import com.portfolio.entity.User;
import com.portfolio.exception.ResourceNotFoundException;
import com.portfolio.repository.FeedbackRepository;
import com.portfolio.repository.ProjectRepository;
import com.portfolio.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ModelMapper modelMapper;

    @Transactional
    public FeedbackDTO addFeedback(Long adminId, Long projectId, FeedbackDTO dto) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        if (dto.getGrade() != null) {
            project.setGrade(dto.getGrade());
            projectRepository.save(project);
        }

        Feedback feedback = Feedback.builder()
                .project(project)
                .admin(admin)
                .message(dto.getMessage())
                .rating(dto.getRating())
                .grade(dto.getGrade())
                .strengths(dto.getStrengths())
                .improve(dto.getImprove())
                .build();

        Feedback saved = feedbackRepository.save(feedback);

        User student = project.getUser();
        emailService.sendFeedbackNotification(student.getEmail(), student.getFirstName(), project.getTitle());

        return toDTO(saved);
    }

    @Transactional
    public List<FeedbackDTO> getFeedbackByProject(Long projectId) {
        return feedbackRepository.findByProjectId(projectId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public FeedbackDTO addGeneralFeedback(Long adminId, Long studentId, String section, FeedbackDTO dto) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        Feedback feedback = Feedback.builder()
                .admin(admin)
                .student(student)
                .section(section)
                .message(dto.getMessage())
                .rating(dto.getRating())
                .strengths(dto.getStrengths())
                .improve(dto.getImprove())
                .build();

        Feedback saved = feedbackRepository.save(feedback);
        emailService.sendFeedbackNotification(student.getEmail(), student.getFirstName(), section);
        return toDTO(saved);
    }

    @Transactional
    public FeedbackDTO replyToFeedback(Long feedbackId, String reply) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found"));
        feedback.setStudentReply(reply);
        return toDTO(feedbackRepository.save(feedback));
    }

    @Transactional
    public List<FeedbackDTO> getFeedbackForStudent(Long userId) {
        List<FeedbackDTO> projectFeedback = feedbackRepository.findByProjectUserId(userId).stream()
                .map(this::toDTO).collect(Collectors.toList());
        List<FeedbackDTO> generalFeedback = feedbackRepository.findByStudentId(userId).stream()
                .map(this::toDTO).collect(Collectors.toList());
        projectFeedback.addAll(generalFeedback);
        return projectFeedback;
    }

    private FeedbackDTO toDTO(Feedback f) {
        FeedbackDTO dto = new FeedbackDTO();
        dto.setId(f.getId());
        if (f.getProject() != null) {
            dto.setProjectId(f.getProject().getId());
            dto.setProjectTitle(f.getProject().getTitle());
        } else {
            dto.setProjectTitle(f.getSection() != null ? f.getSection() : "General Feedback");
        }
        dto.setSection(f.getSection());
        dto.setAdminName(f.getAdmin().getFirstName() + " " + f.getAdmin().getLastName());
        dto.setMessage(f.getMessage());
        dto.setRating(f.getRating());
        dto.setGrade(f.getGrade());
        dto.setStrengths(f.getStrengths());
        dto.setImprove(f.getImprove());
        dto.setStudentReply(f.getStudentReply());
        dto.setCreatedAt(f.getCreatedAt());
        return dto;
    }
}
