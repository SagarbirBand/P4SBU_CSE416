describe('Admin Parking Management', () => {
  beforeEach(() => {
    // First log in as an admin
    cy.visit('http://localhost:3000/login');
    cy.get('input[name="email"]').type('admin@admin.com');
    cy.get('input[name="password"]').type('admin');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('edits an existing parking spot', () => {
    // Go to Parking Management page
    cy.visit('http://localhost:3000/ParkingMgmt');

    // Find a spot's Edit button and click it
    cy.get('[data-cy="edit-spot-button"]').first().click();   // <<< this assumes you add data-cy attribute

    // Edit spot details (whatever fields you allow editing)
    cy.get('input[name="spotName"]').clear().type('Updated Spot Name');

    // Submit/save the changes
    cy.get('button[type="submit"]').click();

    // Confirm that spot now shows the updated name
    cy.contains('Updated Spot Name').should('exist');
  });
});