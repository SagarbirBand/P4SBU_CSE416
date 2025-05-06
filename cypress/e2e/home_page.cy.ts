describe('Home Page (Public Landing)', () => {
  it('shows welcome text and Reserve button', () => {
    cy.visit('/');
    cy.contains('Welcome to P4SBU Parking System').should('exist');
    cy.contains('Reserve Now').should('exist');
  });

  it('has working navigation to Login and Register', () => {
    cy.visit('/');
    cy.contains(/login/i, { timeout: 6000 }).should('exist').click();
    cy.url().should('include', '/login');
  
    cy.go('back');
    cy.contains(/register/i, { timeout: 6000 })
      .should('be.visible')
      .click({ force: true });
    cy.url({ timeout: 8000 }).should('include', '/register');
  });
});