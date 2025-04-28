describe('Home Page', () => {
    it('should load the homepage', () => {
      cy.visit('http://localhost:3000');  // 🚨 make sure your dev server is running!
      cy.contains('Welcome').should('exist'); // ✅ check that "Welcome" text is on the page
    });
  });