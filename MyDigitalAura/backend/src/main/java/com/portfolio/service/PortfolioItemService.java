package com.portfolio.service;

import com.portfolio.dto.PortfolioDTO.*;
import com.portfolio.entity.*;
import com.portfolio.exception.ResourceNotFoundException;
import com.portfolio.repository.*;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;

@Service
public class PortfolioItemService {

    @Autowired
    private SkillRepository skillRepository;
    
    @Autowired
    private HackathonRepository hackathonRepository;
    
    @Autowired
    private InternshipRepository internshipRepository;
    
    @Autowired
    private CertificationRepository certificationRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ModelMapper modelMapper;

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    // Skills
    public SkillDTO saveSkill(Long userId, SkillDTO dto) {
        User user = getUser(userId);
        Skill skill = dto.getId() != null
                ? skillRepository.findById(dto.getId()).orElse(new Skill())
                : new Skill();
        skill.setUser(user);
        skill.setCategory(dto.getCategory());
        skill.setSkills(dto.getSkills());
        skill.setCertLink(dto.getCertLink());
        Skill saved = skillRepository.save(skill);
        SkillDTO result = new SkillDTO();
        result.setId(saved.getId());
        result.setCategory(saved.getCategory());
        result.setSkills(saved.getSkills());
        result.setCertLink(saved.getCertLink());
        return result;
    }

    public void deleteSkill(Long skillId) {
        skillRepository.deleteById(skillId);
    }

    // Hackathons
    public HackathonDTO saveHackathon(Long userId, HackathonDTO dto, MultipartFile certificate) {
        User user = getUser(userId);
        Hackathon h = dto.getId() != null
                ? hackathonRepository.findById(dto.getId()).orElse(new Hackathon())
                : new Hackathon();
        h.setUser(user);
        h.setName(dto.getName());
        h.setSummary(dto.getSummary());
        h.setWebsite(dto.getWebsite());
        if (certificate != null && !certificate.isEmpty()) {
            h.setCertificatePath(saveFile(certificate, "certificates"));
        }
        Hackathon saved = hackathonRepository.save(h);
        HackathonDTO result = new HackathonDTO();
        result.setId(saved.getId());
        result.setName(saved.getName());
        result.setSummary(saved.getSummary());
        result.setWebsite(saved.getWebsite());
        result.setCertificatePath(saved.getCertificatePath());
        return result;
    }

    public void deleteHackathon(Long id) {
        hackathonRepository.deleteById(id);
    }

    // Internships
    public InternshipDTO saveInternship(Long userId, InternshipDTO dto) {
        User user = getUser(userId);
        Internship i = dto.getId() != null
                ? internshipRepository.findById(dto.getId()).orElse(new Internship())
                : new Internship();
        i.setUser(user);
        i.setCompany(dto.getCompany());
        i.setRole(dto.getRole());
        i.setDuration(dto.getDuration());
        i.setWork(dto.getWork());
        Internship saved = internshipRepository.save(i);
        InternshipDTO result = new InternshipDTO();
        result.setId(saved.getId());
        result.setCompany(saved.getCompany());
        result.setRole(saved.getRole());
        result.setDuration(saved.getDuration());
        result.setWork(saved.getWork());
        return result;
    }

    public void deleteInternship(Long id) {
        internshipRepository.deleteById(id);
    }

    // Certifications
    public CertificationDTO saveCertification(Long userId, CertificationDTO dto) {
        User user = getUser(userId);
        Certification c = dto.getId() != null
                ? certificationRepository.findById(dto.getId()).orElse(new Certification())
                : new Certification();
        c.setUser(user);
        c.setName(dto.getName());
        c.setIssueDate(dto.getIssueDate());
        c.setExpiryDate(dto.getExpiryDate());
        c.setLicenseId(dto.getLicenseId());
        c.setLink(dto.getLink());
        Certification saved = certificationRepository.save(c);
        CertificationDTO result = new CertificationDTO();
        result.setId(saved.getId());
        result.setName(saved.getName());
        result.setIssueDate(saved.getIssueDate());
        result.setExpiryDate(saved.getExpiryDate());
        result.setLicenseId(saved.getLicenseId());
        result.setLink(saved.getLink());
        return result;
    }

    public void deleteCertification(Long id) {
        certificationRepository.deleteById(id);
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
}
