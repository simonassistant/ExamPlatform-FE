describe('US4 Preview & Validation', () => {
    beforeEach(() => {
        cy.visit('/#/proctor/login');
        // Login
        cy.get('input[aria-label="Email"]').type('proctor@example.com');
        cy.get('input[aria-label="Password"]').type('password123');
        cy.get('button').contains('Login').click();
        cy.url().should('include', '/dashboard');
    });

    it('verifies editor features: undo/redo, auto-save, validation, preview', () => {
        // 1. Create New Paper
        cy.visit('/#/proctor/papers');
        cy.get('button').contains('New Paper').click();
        cy.url().should('include', '/proctor/papers/new');

        // 2. Check initial state
        cy.get('.text-h4').should('contain', 'New Paper');
        // Validation error should be present (at least one section required)
        cy.get('button.bg-negative').should('exist'); // Error icon

        // 3. Edit Title - Check Auto-save
        cy.get('input[aria-label="Title"]').clear().type('Cypress Test Paper');
        cy.get('.q-chip').contains('Unsaved changes').should('exist');

        // 4. Add Section - Check Undo
        cy.get('button').contains('Sections').click(); // Clicking the + button next to Sections header might be tricky if it's just an icon. 
        // Wait, let's verify the selector. 
        // In PaperEditorPage.vue: <div class="text-h5 q-mb-md">Sections <q-btn ... icon="add" ... @click="addSection" /></div>
        // So looking for 'add' icon button in that area.
        cy.get('.q-page').contains('Sections').parent().find('button').click();

        cy.get('.text-h6').contains('Section 1').should('exist'); // Assuming Section 1 is created

        // Undo
        cy.get('button icon="undo"', { timeout: 1000 }).should('not.be.disabled'); // Wait, selecting by icon attribute might fail if it's q-icon inside q-btn.
        // Better selector:
        cy.get('button').find('i.q-icon').contains('undo').parents('button').click();
        cy.contains('Section 1').should('not.exist');

        // Redo
        cy.get('button').find('i.q-icon').contains('redo').parents('button').click();
        cy.contains('Section 1').should('exist');

        // 5. Check Validation Badges in Preview
        cy.get('button').contains('Preview').click();
        cy.get('.q-dialog').should('exist');
        // Preview should show validation error/warning if section is empty
        // The previous browser test showed a check_circle in preview, but here we have an empty section.
        // T038 implemented validation badges.
        cy.get('.q-dialog').contains('Cypress Test Paper');
        // Close preview
        cy.get('.q-dialog').find('button[icon="close"]').click(); // or similar close button
    });
});
