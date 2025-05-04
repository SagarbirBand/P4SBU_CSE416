describe('Register Flow', () => {
    it('registers successfully', () => {
      cy.visit('http://localhost:3000/register');
  
      cy.get('input[name="name"]').type('Test User');
      cy.get('input[name="email"]').type('newuser@example.com');
      cy.get('input[name="password"]').type('newpassword123');
  
      cy.get('select[id="permit"]').select('Resident');
  
      cy.get('input[name="license"]').type('ABC1234');
      cy.get('input[name="address"]').type('123 Main Street, NY');
  
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
    });
  });