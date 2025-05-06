describe('Profile Editing', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('TJohnTeneJJ@gmail.com');
    cy.get('input[name="password"]').type('TJohnTeneJJ');
    cy.get('button[type="submit"]').click();
    cy.contains(/dashboard/i, { timeout: 6000 }).should('exist')
  });

  it('updates profile successfully', () => {
    cy.visit('/profile');
    cy.get('[data-cy=edit-profile]').click();
    cy.get('input[name="password"]').type('TJohnTeneJJ');
    cy.get('input[name="name"]')
      .should('not.be.disabled')
      .clear()
      .type('New Username');
    cy.get('button[type="submit"]').click();
    cy.contains(/profile/i, { timeout: 6000 }).should('exist')
  });
});
