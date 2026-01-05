describe("Demo: realtime", () => {
  it("records real-time progress for a few seconds", () => {
    cy.visit("/?demo=realtime&motion=on");
    cy.get("[data-testid=timeline]").should("be.visible");

    cy.wait(1500);
    cy.screenshot("realtime-01");

    cy.wait(2000);
    cy.screenshot("realtime-02");
  });
});
