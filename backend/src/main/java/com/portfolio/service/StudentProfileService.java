package com.portfolio.service;

import com.portfolio.dto.PortfolioDTO.*;
import com.portfolio.entity.StudentProfile;
import com.portfolio.entity.User;
import com.portfolio.exception.ResourceNotFoundException;
import com.portfolio.repository.*;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudentProfileService {

    @Autowired
    private StudentProfileRepository profileRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private SkillRepository skillRepository;
    
    @Autowired
    private HackathonRepository hackathonRepository;
    
    @Autowired
    private InternshipRepository internshipRepository;
    
    @Autowired
    private CertificationRepository certificationRepository;
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private ModelMapper modelMapper;

    @Transactional
    public StudentProfileDTO saveProfile(Long userId, StudentProfileDTO dto, MultipartFile photo, MultipartFile resume) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Update user name if provided
        if (dto.getFirstName() != null && !dto.getFirstName().isBlank()) user.setFirstName(dto.getFirstName());
        if (dto.getLastName() != null && !dto.getLastName().isBlank()) user.setLastName(dto.getLastName());
        userRepository.save(user);

        StudentProfile profile = profileRepository.findByUserId(userId)
                .orElse(new StudentProfile());

        profile.setUser(user);
        profile.setGender(dto.getGender());
        profile.setDob(dto.getDob());
        profile.setIdentification(dto.getIdentification());
        profile.setLanguages(dto.getLanguages());
        profile.setContact(dto.getContact());
        profile.setLinkedin(dto.getLinkedin());
        profile.setGithub(dto.getGithub());
        profile.setSummary(dto.getSummary());
        profile.setEducationLevel(dto.getEducationLevel());
        profile.setPostGradType(dto.getPostGradType());
        profile.setPostGradSpecialization(dto.getPostGradSpecialization());
        profile.setPostGradInstitution(dto.getPostGradInstitution());
        profile.setPostGradCgpa(dto.getPostGradCgpa());
        profile.setGradType(dto.getGradType());
        profile.setGradSpecialization(dto.getGradSpecialization());
        profile.setGradInstitution(dto.getGradInstitution());
        profile.setGradCgpa(dto.getGradCgpa());
        profile.setPreUniType(dto.getPreUniType());
        profile.setPreUniInstitution(dto.getPreUniInstitution());
        profile.setPreUniMarks(dto.getPreUniMarks());
        profile.setSecondaryBoard(dto.getSecondaryBoard());
        profile.setSecondaryInstitution(dto.getSecondaryInstitution());
        profile.setSecondaryMarks(dto.getSecondaryMarks());
        if (dto.getDepartment() != null) profile.setDepartment(dto.getDepartment());
        if (dto.getYear() != null) profile.setYear(dto.getYear());
        if (dto.getGpa() != null) profile.setGpa(dto.getGpa());
        if (dto.getStudentStatus() != null) profile.setStudentStatus(dto.getStudentStatus());

        if (photo != null && !photo.isEmpty()) {
            profile.setPhotoPath(saveFile(photo, "photos"));
        }
        if (resume != null && !resume.isEmpty()) {
            profile.setResumePath(saveFile(resume, "resumes"));
        }

        return toDTO(profileRepository.save(profile));
    }

    @Transactional
    public StudentProfileDTO getProfile(Long userId) {
        return profileRepository.findByUserId(userId)
                .map(this::toDTO)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId).orElse(null);
                    if (user == null) throw new ResourceNotFoundException("User not found");
                    StudentProfileDTO dto = new StudentProfileDTO();
                    dto.setUserId(user.getId());
                    dto.setFirstName(user.getFirstName());
                    dto.setLastName(user.getLastName());
                    dto.setEmail(user.getEmail());
                    return dto;
                });
    }

    @Transactional
    public List<StudentProfileDTO> getAllStudents() {
        try {
            List<User> allUsers = userRepository.findAll();
            System.out.println("Total users found: " + allUsers.size());
            
            List<User> students = allUsers.stream()
                    .filter(u -> u.getRole() == User.Role.STUDENT)
                    .collect(Collectors.toList());
            System.out.println("Students found: " + students.size());
            
            return students.stream()
                    .map(u -> {
                        StudentProfileDTO dto = profileRepository.findByUserId(u.getId())
                                .map(this::toDTO)
                                .orElseGet(() -> {
                                    StudentProfileDTO d = new StudentProfileDTO();
                                    d.setUserId(u.getId());
                                    d.setFirstName(u.getFirstName());
                                    d.setLastName(u.getLastName());
                                    d.setEmail(u.getEmail());
                                    d.setStudentStatus("Active");
                                    d.setDepartment("Not Set");
                                    d.setYear("Not Set");
                                    d.setGpa(0.0);
                                    return d;
                                });
                        dto.setProjectCount((int) projectRepository.findByUserId(u.getId()).size());
                        return dto;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error in getAllStudents: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public List<SkillDTO> getSkills(Long userId) {
        return skillRepository.findByUserId(userId).stream()
                .map(s -> {
                    SkillDTO dto = new SkillDTO();
                    dto.setId(s.getId());
                    dto.setCategory(s.getCategory());
                    dto.setSkills(s.getSkills());
                    dto.setCertLink(s.getCertLink());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public List<HackathonDTO> getHackathons(Long userId) {
        return hackathonRepository.findByUserId(userId).stream()
                .map(h -> {
                    HackathonDTO dto = new HackathonDTO();
                    dto.setId(h.getId());
                    dto.setName(h.getName());
                    dto.setSummary(h.getSummary());
                    dto.setWebsite(h.getWebsite());
                    dto.setCertificatePath(h.getCertificatePath());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public List<InternshipDTO> getInternships(Long userId) {
        return internshipRepository.findByUserId(userId).stream()
                .map(i -> {
                    InternshipDTO dto = new InternshipDTO();
                    dto.setId(i.getId());
                    dto.setCompany(i.getCompany());
                    dto.setRole(i.getRole());
                    dto.setDuration(i.getDuration());
                    dto.setWork(i.getWork());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public List<CertificationDTO> getCertifications(Long userId) {
        return certificationRepository.findByUserId(userId).stream()
                .map(c -> {
                    CertificationDTO dto = new CertificationDTO();
                    dto.setId(c.getId());
                    dto.setName(c.getName());
                    dto.setIssueDate(c.getIssueDate());
                    dto.setExpiryDate(c.getExpiryDate());
                    dto.setLicenseId(c.getLicenseId());
                    dto.setLink(c.getLink());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    private String saveFile(MultipartFile file, String subDir) {
        try {
            Path uploadPath = Paths.get("uploads/" + subDir);
            Files.createDirectories(uploadPath);
            String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), uploadPath.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            return "uploads/" + subDir + "/" + filename;
        } catch (IOException e) {
            return null;
        }
    }

    private StudentProfileDTO toDTO(StudentProfile p) {
        StudentProfileDTO dto = new StudentProfileDTO();
        dto.setId(p.getId());
        dto.setUserId(p.getUser().getId());
        dto.setFirstName(p.getUser().getFirstName());
        dto.setLastName(p.getUser().getLastName());
        dto.setEmail(p.getUser().getEmail());
        dto.setGender(p.getGender());
        dto.setDob(p.getDob());
        dto.setIdentification(p.getIdentification());
        dto.setLanguages(p.getLanguages());
        dto.setContact(p.getContact());
        dto.setLinkedin(p.getLinkedin());
        dto.setGithub(p.getGithub());
        dto.setSummary(p.getSummary());
        dto.setPhotoPath(p.getPhotoPath());
        dto.setResumePath(p.getResumePath());
        dto.setEducationLevel(p.getEducationLevel());
        dto.setPostGradType(p.getPostGradType());
        dto.setPostGradSpecialization(p.getPostGradSpecialization());
        dto.setPostGradInstitution(p.getPostGradInstitution());
        dto.setPostGradCgpa(p.getPostGradCgpa());
        dto.setGradType(p.getGradType());
        dto.setGradSpecialization(p.getGradSpecialization());
        dto.setGradInstitution(p.getGradInstitution());
        dto.setGradCgpa(p.getGradCgpa());
        dto.setPreUniType(p.getPreUniType());
        dto.setPreUniInstitution(p.getPreUniInstitution());
        dto.setPreUniMarks(p.getPreUniMarks());
        dto.setSecondaryBoard(p.getSecondaryBoard());
        dto.setSecondaryInstitution(p.getSecondaryInstitution());
        dto.setSecondaryMarks(p.getSecondaryMarks());
        dto.setDepartment(p.getDepartment());
        dto.setYear(p.getYear());
        dto.setGpa(p.getGpa());
        dto.setStudentStatus(p.getStudentStatus() != null ? p.getStudentStatus() : "Active");
        dto.setLastActive(p.getLastActive());
        return dto;
    }
}
