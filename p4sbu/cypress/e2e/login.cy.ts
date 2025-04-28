describe('Login Flow', () => {
    it('logs in successfully', () => {
      cy.visit('http://localhost:3000/login');
      cy.get('input[name="email"]').type('user@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
    });
  });