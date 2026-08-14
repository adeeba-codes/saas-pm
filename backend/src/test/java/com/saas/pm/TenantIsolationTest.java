package com.saas.pm;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.saas.pm.entity.Organization;
import com.saas.pm.entity.Project;
import com.saas.pm.repository.OrganizationRepository;
import com.saas.pm.repository.ProjectRepository;
import com.saas.pm.security.TenantContext;
import com.saas.pm.service.ProjectService;

// This test proves that a user from one organization
// cannot access a project belonging to another organization.
@SpringBootTest
public class TenantIsolationTest {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Test
    @Transactional
    void userFromOrgB_cannotAccessOrgA_project() {

        // -------------------------------------------------
        // 1. Create real organizations in the database
        // -------------------------------------------------

        Organization orgA = new Organization();
        orgA.setName("Organization A");
        orgA = organizationRepository.save(orgA);

        Organization orgB = new Organization();
        orgB.setName("Organization B");
        orgB = organizationRepository.save(orgB);


        // -------------------------------------------------
        // 2. Act as Organization A
        // -------------------------------------------------

        TenantContext.set(
                orgA.getId(),
                UUID.randomUUID(),
                "ADMIN"
        );

        Project created =
                projectService.createProject("Org A Secret Project");


        // -------------------------------------------------
        // 3. Switch to Organization B
        // -------------------------------------------------

        TenantContext.set(
                orgB.getId(),
                UUID.randomUUID(),
                "ADMIN"
        );


        // -------------------------------------------------
        // 4. Organization B tries to access
        //    Organization A's project
        // -------------------------------------------------

        assertThrows(SecurityException.class, () -> {
            projectService.getProject(created.getId());
        });


        // -------------------------------------------------
        // 5. Clean up TenantContext
        // -------------------------------------------------

        TenantContext.clear();
    }
}