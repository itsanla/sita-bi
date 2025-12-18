describe('Health Check', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should not hang or timeout', (done) => {
    setTimeout(() => {
      expect(1 + 1).toBe(2);
      done();
    }, 100);
  }, 5000); // 5 second timeout for this test
});
