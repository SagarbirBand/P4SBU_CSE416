describe('Admin Parking Management', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('TJohnTeneJJ@gmail.com');
    cy.get('input[name="password"]').type('TJohnTeneJJ');
    cy.get('button[type="submit"]').click();
    cy.contains(/dashboard/i, { timeout: 8000 }).should('exist');
  });

  it('edits an existing lot spot count', () => {
    cy.visit('/ParkingMgmt');

    cy.contains('Lot 4 Union Metered Lot')
      .parent()
      .within(() => {
        cy.contains('Edit Rate & Spots').click();
      });

    // metered is the 3rd row (0 index)
    cy.get('input').eq(4).clear().type('61'); // metered count
    cy.get('button').contains('Save').click();
  });


  it('adds a new lot with custom spot types', () => {
    cy.visit('/ParkingMgmt');
    cy.contains('Add New Lot').click();

    cy.contains('Add New Parking Lot')
    .parentsUntil('body')
    .last()
    .within(() => {
      // Find the Name field via its label
      cy.get('label')
        .contains('Name')
        .parent()
        .find('input')
        .clear()
        .type('Test Lot Cypress');
;
        cy.get('input[type="number"]').eq(0).clear().type('4.5', { delay: 50 }); // rate
        cy.get('input[type="number"]').eq(1).clear().type('12', { delay: 50 });  // spot 1
        cy.get('input[type="number"]').eq(2).clear().type('5', { delay: 50 });   // spot 2
    
        cy.get('button[type="save"]').click();
      }); 
    cy.get('.modal', { timeout: 5000 }).should('not.exist');
    cy.contains('Test Lot Cypress', { timeout: 6000 }).should('exist');
  });      
});
