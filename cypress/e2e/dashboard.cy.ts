describe('Dashboard View', () => {
    it('displays dashboard after login', () => {
      cy.visit('http://localhost:3000/dashboard');
      cy.contains('Welcome').should('exist');
    });
  });