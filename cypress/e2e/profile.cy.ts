describe('Profile Editing', () => {
    beforeEach(() => {
      cy.visit('http://localhost:3000/login');
      cy.get('input[name="email"]').type('user@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
    });
  
    it('updates profile successfully', () => {
      cy.visit('http://localhost:3000/profile');
  
      // Click edit button to enable inputs
      cy.get('[data-cy=edit-profile]').click();
  
      cy.get('input[name="password"]').type('password123');
      // Now input should be editable
      cy.get('input[name="name"]')
        .should('not.be.disabled')
        .clear()
        .type('New Username');

      cy.get('button[type="submit"]').click();
  
    });
  });