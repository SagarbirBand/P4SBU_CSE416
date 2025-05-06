describe('Login API sanity check', () => {
    it('calls API with valid creds and logs status', () => {
      cy.request({
        method: 'PUT',
        url: '/api/login',
        body: {
          email: 'TJohnTeneJJ@gmail.com',
          password: 'TJohnTeneJJ'
        },
        failOnStatusCode: false
      }).then(res => {
        console.log('Login API Response:', res.status, res.body);
      });
    });
  });